import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/audit";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "text/csv": "csv",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/png": "png",
  "image/jpeg": "jpg",
};

function signatureMatches(buffer: Buffer, mimeType: string) {
  if (mimeType === "text/csv") return true;
  if (mimeType === "application/pdf") return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType.includes("openxmlformats")) return buffer[0] === 0x50 && buffer[1] === 0x4b;
  if (mimeType === "application/vnd.ms-excel") {
    return buffer.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0]));
  }
  return false;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "OPD" || !session.opdId) {
    return NextResponse.json({ error: "Hanya pengguna OPD yang dapat mengunggah dokumen." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Format unggahan tidak valid." }, { status: 400 });
  }
  const value = formData.get("file");
  if (!(value instanceof File)) {
    return NextResponse.json({ error: "Berkas wajib dipilih." }, { status: 400 });
  }
  const extension = ALLOWED_TYPES[value.type];
  if (!extension) {
    return NextResponse.json({ error: "Tipe berkas tidak diizinkan. Gunakan PDF, DOCX, XLS/XLSX, CSV, PNG, atau JPG." }, { status: 415 });
  }
  if (value.size <= 0 || value.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Ukuran berkas harus antara 1 byte dan 10 MB." }, { status: 413 });
  }

  const buffer = Buffer.from(await value.arrayBuffer());
  if (!signatureMatches(buffer, value.type)) {
    return NextResponse.json({ error: "Isi berkas tidak sesuai dengan tipe yang dilaporkan." }, { status: 415 });
  }

  const storageName = `${randomUUID()}.${extension}`;
  const uploadDir = path.join(process.cwd(), "storage", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, storageName), buffer, { flag: "wx" });

  const uploaded = await db.uploadedFile.create({
    data: {
      originalName: value.name.slice(0, 240),
      storageName,
      mimeType: value.type,
      size: value.size,
      uploadedById: session.id,
      opdId: session.opdId,
    },
  });
  await logActivity({
    actor: session,
    action: "UPLOAD",
    entityType: "UploadedFile",
    entityId: uploaded.id,
    detail: `Mengunggah dokumen pendukung ${uploaded.originalName} (${uploaded.size} byte)`,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({ id: uploaded.id, name: uploaded.originalName, size: uploaded.size });
}


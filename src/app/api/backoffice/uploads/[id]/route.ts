import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });

  const { id } = await params;
  const uploaded = await db.uploadedFile.findUnique({ where: { id } });
  if (!uploaded || (session.role === "OPD" && uploaded.opdId !== session.opdId)) {
    return NextResponse.json({ error: "Berkas tidak ditemukan" }, { status: 404 });
  }

  try {
    const buffer = await readFile(path.join(process.cwd(), "storage", "uploads", uploaded.storageName));
    const asciiName = uploaded.originalName.replace(/[^a-zA-Z0-9._-]+/g, "-");
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": uploaded.mimeType,
        "Content-Length": String(buffer.length),
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(uploaded.originalName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Berkas fisik tidak tersedia" }, { status: 404 });
  }
}


import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateCsv, generatePdf, safeFileName } from "@/lib/file-generator";

/**
 * Endpoint unduh publikasi — hanya file publikasi berstatus PUBLISHED
 * dan visibility PUBLIC yang boleh diakses masyarakat (public by approval).
 * File di-generate on-the-fly dengan nama internal aman.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const publikasi = await db.publikasi.findUnique({
    where: { id },
    include: { opd: true },
  });

  if (!publikasi || publikasi.status !== "PUBLISHED" || publikasi.visibility !== "PUBLIC") {
    return NextResponse.json({ error: "Publikasi tidak tersedia" }, { status: 404 });
  }

  const pemilik = publikasi.opd?.nama ?? "Bapperida Kabupaten Pinrang";
  const meta = [
    ["Judul", publikasi.judul],
    ["Pemilik", pemilik],
    ["Tahun", String(publikasi.tahun ?? "-")],
    ["Deskripsi", publikasi.deskripsi],
  ];

  let body: Buffer;
  let mime: string;
  let ext: string;

  if (publikasi.jenisFile === "CSV" || publikasi.jenisFile === "XLSX") {
    const rows = [["Uraian", "Nilai"], ...meta];
    body = Buffer.from(generateCsv(publikasi.judul, rows), "utf8");
    mime = "text/csv";
    ext = "csv";
  } else {
    body = generatePdf(publikasi.judul, [
      publikasi.deskripsi,
      `Publikasi ini diterbitkan oleh ${pemilik} melalui Sistem Pelayanan Digital Bapperida Kabupaten Pinrang.`,
      `Status publikasi: Published. Visibility: Public. Tahun: ${publikasi.tahun ?? "-"}.`,
      `Dokumen diunduh pada ${new Date().toLocaleString("id-ID")} melalui portal resmi Bapperida Kabupaten Pinrang.`,
    ]);
    mime = "application/pdf";
    ext = "pdf";
  }

  await db.publikasi.update({
    where: { id },
    data: { downloadCount: { increment: 1 } },
  });

  const fileName = safeFileName(publikasi.judul, ext);
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": String(body.length),
      "Cache-Control": "no-store",
    },
  });
}

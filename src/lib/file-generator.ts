import crypto from "crypto";

/**
 * Generator file publikasi sederhana (CSV & minimal PDF).
 * File di-generate on-the-fly dari metadata publikasi —
 * nama file asli hanya disimpan sebagai metadata (sesuai kebijakan
 * keamanan file pada dokumen desain).
 */

export function generateCsv(judul: string, rows: string[][]): string {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = [esc(`Publikasi: ${judul}`), esc(`Dihasilkan: ${new Date().toLocaleString("id-ID")}`), "", ...rows.map((r) => r.map(esc).join(","))];
  return lines.join("\n");
}

function escapePdfText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    // ganti karakter non-ASCII umum
    .replace(/—/g, "-")
    .replace(/–/g, "-")
    .replace(/’/g, "'")
    .replace(/[^\x20-\x7E]/g, "?");
}

/** Minimal single/multi-page PDF dengan Helvetica */
export function generatePdf(title: string, paragraphs: string[]): Buffer {
  const pageW = 595, pageH = 842, margin = 56, lineH = 16;
  const maxChars = 92; // perkiraan pada fontsize 11

  // Bungkus paragraf jadi baris
  const lines: { text: string; size: number; gap: number }[] = [];
  lines.push({ text: escapePdfText(title), size: 16, gap: 10 });
  lines.push({ text: "", size: 11, gap: 0 });
  for (const p of paragraphs) {
    const words = p.split(/\s+/);
    let current = "";
    for (const w of words) {
      if ((current + " " + w).trim().length > maxChars) {
        lines.push({ text: escapePdfText(current.trim()), size: 11, gap: 0 });
        current = w;
      } else {
        current = (current + " " + w).trim();
      }
    }
    if (current) lines.push({ text: escapePdfText(current), size: 11, gap: 0 });
    lines.push({ text: "", size: 11, gap: 0 });
  }
  lines.push({ text: escapePdfText(`Dokumen resmi - Bapperida Kabupaten Pinrang`), size: 9, gap: 0 });

  // Pecah jadi halaman
  const perPage = Math.floor((pageH - margin * 2) / lineH);
  const pages: typeof lines[] = [];
  for (let i = 0; i < lines.length; i += perPage) pages.push(lines.slice(i, i + perPage));

  const objects: string[] = [];
  const pageObjIds: number[] = [];
  const contentObjIds: number[] = [];
  const firstPageObj = 4;
  pages.forEach((_, i) => {
    pageObjIds.push(firstPageObj + i * 2);
    contentObjIds.push(firstPageObj + i * 2 + 1);
  });

  objects.push(`<< /Type /Catalog /Pages 2 0 R >>`); // 1
  objects.push(`<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`); // 2
  objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`); // 3

  pages.forEach((pageLines, pi) => {
    const contentId = contentObjIds[pi];
    const pageId = pageObjIds[pi];
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents ${contentId} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`); // page obj
    // content stream
    let y = pageH - margin;
    const parts: string[] = [];
    for (const l of pageLines) {
      y -= l.size > 12 ? lineH * 1.4 : lineH;
      if (l.text) {
        parts.push(`BT /F1 ${l.size} Tf ${margin} ${y} Td (${l.text}) Tj ET`);
      }
    }
    const stream = parts.join("\n");
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  // Serialize dengan xref
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${off.toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

export function safeFileName(judul: string, ext: string): string {
  const base = judul
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "publikasi"}.${ext.toLowerCase()}`;
}

export function checksumOf(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

import sharp from "sharp";

// Small logos live in PostgreSQL so they persist on serverless deployments.
export async function encodeOpdLogo(file: File): Promise<string> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("Gunakan gambar logo PNG, JPG, atau WebP.");
  }
  if (file.size === 0 || file.size > 2 * 1024 * 1024) throw new Error("Ukuran logo maksimal 2 MB.");
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 16_000_000 });
    const metadata = await image.metadata();
    if (!["png", "jpeg", "webp"].includes(metadata.format ?? "")) throw new Error();
    const encoded = await image.rotate().resize(512, 512, { fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    if (encoded.length > 300 * 1024) throw new Error();
    return `data:image/webp;base64,${encoded.toString("base64")}`;
  } catch {
    throw new Error("Gambar logo tidak valid atau resolusinya terlalu besar.");
  }
}

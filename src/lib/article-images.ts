import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

export const articleImageDirectory = path.join(process.cwd(), "storage", "article-images");

export async function saveArticleImage(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error("Gunakan foto JPG, PNG, atau WebP.");
  }
  if (file.size > 5 * 1024 * 1024) throw new Error("Ukuran foto maksimal 5 MB.");
  let image: Buffer;
  try {
    const input = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 25_000_000 });
    const metadata = await input.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format ?? '')) throw new Error();
    image = await input.rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  } catch {
    throw new Error("Foto tidak valid atau resolusinya terlalu besar.");
  }
  const filename = `${randomUUID()}.webp`;
  await mkdir(articleImageDirectory, { recursive: true });
  await writeFile(path.join(articleImageDirectory, filename), image, { flag: 'wx' });
  return `/api/public/article-images/${filename}`;
}

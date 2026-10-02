import { readFile } from "fs/promises";
import path from "path";
import { articleImageDirectory } from "@/lib/article-images";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (!/^[a-f0-9-]{36}\.webp$/.test(filename)) return new Response(null, { status: 404 });
  try {
    const image = await readFile(path.join(articleImageDirectory, filename));
    return new Response(new Uint8Array(image), {
      headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}

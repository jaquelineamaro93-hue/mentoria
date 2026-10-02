import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

const PARTS = ['part1.txt', 'part2.txt', 'part3.txt', 'part4.txt'];

export async function GET() {
  const base64 = PARTS.map((file) =>
    readFileSync(join(process.cwd(), 'lib', 'hero-collage', file), 'utf8').trim()
  ).join('');

  const image = Buffer.from(base64, 'base64');

  return new Response(image, {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

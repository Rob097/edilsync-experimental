import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');
const outputDir = path.join(publicDir, 'images', 'optimized');

const jobs = [
  {
    input: path.join(publicDir, 'images', 'hero-image.png'),
    outputs: [
      { name: 'hero-image-672.webp', width: 672, quality: 72 },
      { name: 'hero-image-1120.webp', width: 1120, quality: 72 },
    ],
  },
  {
    input: path.join(publicDir, 'images', 'michele.png'),
    outputs: [
      { name: 'michele-160.webp', width: 160, quality: 74 },
    ],
  },
  {
    input: path.join(publicDir, 'images', 'matteo.png'),
    outputs: [
      { name: 'matteo-160.webp', width: 160, quality: 74 },
    ],
  },
  {
    input: path.join(publicDir, 'images', 'marco.png'),
    outputs: [
      { name: 'marco-160.webp', width: 160, quality: 74 },
    ],
  },
  {
    input: path.join(publicDir, 'favicon.png'),
    outputs: [
      { name: 'favicon-64.webp', width: 64, quality: 78 },
    ],
  },
];

await fs.mkdir(outputDir, { recursive: true });

for (const job of jobs) {
  for (const output of job.outputs) {
    const targetPath = path.join(outputDir, output.name);
    await sharp(job.input)
      .resize({ width: output.width, withoutEnlargement: true })
      .webp({ quality: output.quality, effort: 5 })
      .toFile(targetPath);
  }
}

await sharp(path.join(publicDir, 'favicon.png'))
  .resize({ width: 64, withoutEnlargement: true })
  .png({ compressionLevel: 9, palette: true })
  .toFile(path.join(outputDir, 'favicon-64.png'));

console.log(`Optimized ${jobs.length} source images into ${outputDir}`);
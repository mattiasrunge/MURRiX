import { join } from '@std/path';
import { BundleOptions } from './types.ts';

const copyDir = async (src: string, dest: string) => {
  await Deno.mkdir(dest, { recursive: true });

  for await (const entry of Deno.readDir(src)) {
    const srcPath = `${src}/${entry.name}`;
    const destPath = `${dest}/${entry.name}`;

    if (entry.isDirectory) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile) {
      console.log(`  ${entry.name}`);
      await Deno.copyFile(srcPath, destPath);
    }
  }
};

export const copyAssets = async (opts: BundleOptions) => {
  console.log('Copying assets...\n');

  console.log(`  index.html`);
  await Deno.copyFile(opts.indexFile, join(opts.distDir, 'index.html'));

  await copyDir(opts.staticDir, join(opts.distDir, 'static'));
};

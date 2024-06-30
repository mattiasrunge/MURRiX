import { join } from '@std/path';
import { exists } from '@std/fs';
import { BuildOptions } from '../types.ts';
import { watch } from './watch.ts';

const copyDir = async (src: string, dest: string) => {
  await Deno.mkdir(dest, { recursive: true });

  for await (const entry of Deno.readDir(src)) {
    const srcPath = `${src}/${entry.name}`;
    const destPath = `${dest}/${entry.name}`;

    if (entry.isDirectory) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile) {
      await Deno.copyFile(srcPath, destPath);
    }
  }
};

export const copyAssets = async (opts: BuildOptions) => {
  const srcDir = join(opts.srcDir, 'public');
  const dstDir = join(opts.distDir, 'public');

  if (await exists(srcDir)) {
    if (opts.dev) {
      console.log(`[watch] copy assets started`);
    } else {
      console.log('Copy assets started...');
    }

    await copyDir(srcDir, dstDir);

    if (opts.dev) {
      console.log('[watch] copy assets finished, watching for changes...');
      watch(srcDir, true, async (event: string, path: string) => {
        const relpath = path.replace(opts.srcDir, '');

        console.log(`[watch] copy assets started (${event}: "${relpath}")`);
        await Deno.remove(dstDir, { recursive: true });
        await copyDir(srcDir, dstDir);
        console.log('[watch] copy assets finished');
      });
    }

    if (!opts.dev) {
      console.log('Copy assets finished!');
    }
  }
};

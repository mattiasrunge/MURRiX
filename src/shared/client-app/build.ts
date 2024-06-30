import { exists } from '@std/fs';
import { BuildOptions } from './types.ts';
import { copyAssets } from './lib/copy-assets.ts';
import { bundleApp } from './lib/bundle-app.ts';
import { createApp } from './lib/create-app.ts';
import { listFiles } from './lib/list-files.ts';
import { humanizeBytes } from './lib/humanize-bytes.ts';

// TODO: Decide how to handle compression.
// Right now only things that are passed through
// esbuild will have compressed versions.
// So we might do this as a step after esbuild.
// But currently there are no brotli APIs availabe
// in Deno that can be used and resorting to
// command line tools will introduce more dependencies.

/**
 * Builds the client application.
 *
 * @param opts - The build options.
 */
export const build = async (opts: BuildOptions) => {
  if (await exists(opts.distDir)) {
    await Deno.remove(opts.distDir, { recursive: true });
  }

  await Deno.mkdir(opts.distDir, { recursive: true });

  await copyAssets(opts);
  const appFile = await createApp(opts);
  await bundleApp(opts, appFile);

  if (!opts.dev) {
    const files = await listFiles(opts.distDir);

    console.log('\nFiles:');
    for (const file of files) {
      console.log(`  ${file.name.padEnd(45)} ${humanizeBytes(file.size)}`);
    }

    console.log('\nAll done!');
  }
};

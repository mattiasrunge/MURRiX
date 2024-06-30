import { BuildOptions } from './types.ts';
import { copyAssets } from './lib/copy-assets.ts';
import { bundleApp } from './lib/bundle-app.ts';
import { createApp } from './lib/create-app.ts';

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
  await Deno.mkdir(opts.distDir, { recursive: true });

  const appFile = await createApp(opts);

  // console.log('');

  await copyAssets(opts);

  // console.log('');

  await bundleApp(opts, appFile);

  // console.log('\nAll done!');
};

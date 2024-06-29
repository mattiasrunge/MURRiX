import { BundleOptions } from './types.ts';
import { copyAssets } from './copy-assets.ts';
import { bundle } from './bundle.ts';
import { createApp } from './create-app.ts';

export const build = async (opts: BundleOptions) => {
  await Deno.mkdir(opts.distDir, { recursive: true });
  const tmpdir = await Deno.makeTempDir();

  try {
    const appFile = await createApp(opts, tmpdir);

    console.log('');

    await copyAssets(opts);

    console.log('');

    await bundle(opts, appFile);
  } catch (err) {
    throw err;
  } finally {
    await Deno.remove(tmpdir, { recursive: true });
  }

  console.log('\nAll done!');
};

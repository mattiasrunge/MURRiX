import { emptyDir } from '@std/fs';
import { join } from '@std/path';
import { BuildOptions } from './types.ts';
import { stepCopyPublicAssets } from './steps/step-copy-public-assets.ts';
import { stepBuild } from './steps/step-build.ts';
import { stepGenerateEntryPoint } from './steps/step-generate-entry-point.ts';
import { stepGenerateIndex } from './steps/step-generate-index.ts';
import { stepListFiles } from './steps/step-list-files.ts';

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
  await emptyDir(opts.distDir);

  const internalOpts = {
    ...opts,
    appFile: join(opts.workDir, 'app.tsx'),
  };

  await stepCopyPublicAssets(internalOpts);
  await stepGenerateIndex(internalOpts);
  await stepGenerateEntryPoint(internalOpts);
  await stepBuild(internalOpts);
  await stepListFiles(internalOpts);

  if (!opts.dev) {
    console.log('\nAll done!');
  }
};

import { join } from '@std/path';
import { copy, exists } from '@std/fs';
import { InternalOptions } from '../types.ts';
import { step } from '../lib/step.ts';

export const stepCopyPublicAssets = async (opts: InternalOptions) => {
  const srcDir = join(opts.srcDir, 'public');
  const dstDir = join(opts.distDir, 'public');

  if (!(await exists(srcDir))) {
    return;
  }

  await step(opts, {
    name: 'copy public assets',
    watchChanges: true,
    fn: async () => {
      if (await exists(dstDir)) {
        await Deno.remove(dstDir, { recursive: true });
      }

      await copy(srcDir, dstDir);

      return [srcDir];
    },
  });
};

import { humanizeSize, listFiles } from '~/src/shared/utils/mod.ts';
import { InternalOptions } from '../types.ts';
import { step } from '../lib/step.ts';

export const stepListFiles = async (opts: InternalOptions) => {
  if (!opts.dev) {
    await step(opts, {
      name: 'list files',
      fn: async () => {
        const files = await listFiles(opts.distDir);

        for (const file of files) {
          console.log(`  ${file.name.padEnd(45)} ${humanizeSize(file.stat.size)}`);
        }

        return [];
      },
    });
  }
};

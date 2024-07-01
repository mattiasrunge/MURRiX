import { InternalOptions } from '../types.ts';
import { step } from '../lib/step.ts';
import { generateIndex } from '../lib/generate-index.ts';

export const stepGenerateIndex = async (opts: InternalOptions) => {
  await step(opts, {
    name: 'generate index',
    watchChanges: true,
    fn: async () => {
      return await generateIndex(opts);
    },
  });
};

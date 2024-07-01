import { InternalOptions } from '../types.ts';
import { step } from '../lib/step.ts';
import { generateEntryPoint } from '../lib/generate-entry-point.ts';

export const stepGenerateEntryPoint = async (opts: InternalOptions) => {
  await step(opts, {
    name: 'generate entry point',
    watchChanges: false,
    fn: async () => {
      return await generateEntryPoint(opts);
    },
  });
};

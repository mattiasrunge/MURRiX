import { basename } from '@std/path';
import { InternalOptions, StepOptions } from '../types.ts';
import { watch } from './watch.ts';

export const step = async (opts: InternalOptions, stepOpts: StepOptions) => {
  if (opts.dev) {
    console.log(`[watch] ${stepOpts.name} started`);
  } else {
    console.log(`[step] ${stepOpts.name} started...`);
  }

  const paths = await stepOpts.fn();

  if (opts.dev) {
    if (paths.length > 0) {
      console.log(`[watch] ${stepOpts.name} finished, watching for changes...`);
      // console.log(`[watch] ${stepOpts.name} paths: ${paths.join(', ')}`);

      watch(paths, !!stepOpts.watchChanges, async (event: string, path: string) => {
        let relpath = path;

        for (const watchPath of paths) {
          relpath = path.replace(watchPath, '');
          break;
        }

        if (relpath === '') {
          relpath = basename(path);
        }

        console.log(`[watch] ${stepOpts.name} started (${event}: "${relpath}")`);

        await stepOpts.fn();

        console.log(`[watch] ${stepOpts.name} finished`);
      });
    }
  } else {
    console.log(`[step] ${stepOpts.name} finished!`);
  }
};

import { Watcher } from './types.ts';

export const watch = async (dir: string, changes: boolean, fn: Watcher) => {
  let timeout: number | undefined;

  const debounceFn = async (kind: string, filePath: string) => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      await fn(kind, filePath);
    }, 500);
  };

  for await (const event of Deno.watchFs(dir, { recursive: true })) {
    for (const filePath of event.paths) {
      if (event.kind === 'create' || event.kind === 'remove' || (changes && event.kind === 'modify')) {
        await debounceFn(event.kind, filePath);
      }
    }
  }
};

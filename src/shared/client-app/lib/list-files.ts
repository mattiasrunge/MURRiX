import { walk } from '@std/fs';
import { File } from './types.ts';

export const listFiles = async (dir: string): Promise<File[]> => {
  const files: File[] = [];

  for await (const entry of walk(dir)) {
    if (entry.isFile) {
      const size = await Deno.stat(entry.path).then((stat) => stat.size);
      const name = entry.path.replace(dir, '').replace(/^\//, '');

      files.push({ name, size });
    }
  }

  files.sort((a, b) => a.name.localeCompare(b.name));

  return files;
};

import { walk } from '@std/fs';

export type File = {
  path: string;
  name: string;
  stat: Deno.FileInfo;
};

/**
 * Retrieves a sorted list of files in the specified directory.
 *
 * @param dir - The directory path.
 * @returns A promise that resolves to an array of File objects.
 */
export const listFiles = async (dir: string): Promise<File[]> => {
  const files: File[] = [];

  for await (const entry of walk(dir)) {
    if (entry.isFile) {
      files.push({
        path: entry.path,
        name: entry.path.replace(dir, '').replace(/^\//, ''),
        stat: await Deno.stat(entry.path),
      });
    }
  }

  files.sort((a, b) => a.name.localeCompare(b.name));

  return files;
};

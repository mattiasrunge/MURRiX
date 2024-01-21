import { FS } from '~/src/external/fs/mod.ts';
import { FileMetadata } from '../types.ts';
import { resolveFilename } from '../utils/mod.ts';

export const getInfo = async (fs: FS, id: string, area: string) => {
  const filename = resolveFilename(fs, id, area);
  const content = await Deno.readTextFile(filename);
  return JSON.parse(content) as FileMetadata;
};

import { assert } from 'std/assert/mod.ts';
import { join } from 'std/path/mod.ts';
import { FS } from '~/src/external/fs/mod.ts';
import { StagedFileMetadata } from '../types.ts';

export const getStagedFilename = async (fs: FS, stagedId: string) => {
  const metafile = join(fs.getStagedPath(), `${stagedId}.json`);
  const content = await Deno.readTextFile(metafile);
  const meta = JSON.parse(content) as StagedFileMetadata;

  assert(meta?.metadata?.filename, 'Staged file metadata is missing filename');

  return meta.metadata.filename;
};

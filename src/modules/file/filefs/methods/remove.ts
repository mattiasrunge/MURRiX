import { join } from 'std/path/join.ts';
import { log } from '~/src/shared/log/mod.ts';
import { FS } from '~/src/external/fs/mod.ts';
import { resolveFilename } from '../utils/mod.ts';

export type HandlerFileRemoveOptions = {
  filesDir: string;
  removedDir: string;
};

export const remove = async (fs: FS, id: string, area: string) => {
  const dir = fs.getNamedPath(area);
  const removedDir = join(dir, 'removed');
  await Deno.mkdir(removedDir, { recursive: true });

  const filename = resolveFilename(fs, id, area);
  const metaFilename = `${filename}.json`;

  await Deno.stat(filename);
  await Deno.stat(metaFilename);

  await Deno.rename(filename, join(removedDir, id));
  await Deno.rename(metaFilename, join(removedDir, `${id}.json`));

  log.info(`[Remove] Successfully moved file with id ${id} to removed directory`);

  // TODO: Remove empty folders
};

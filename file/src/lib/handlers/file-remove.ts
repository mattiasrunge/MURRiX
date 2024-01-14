import { join } from 'std/path/join.ts';
import { createHttpError, RouterContext } from 'oak';
import { log } from '~/src/lib/log.ts';

export type HandlerFileRemoveOptions = {
  filesDir: string;
  removedDir: string;
};

export const handlerFileRemove = async (context: RouterContext<string>, fileId: string, opts: HandlerFileRemoveOptions) => {
  const filename = fileId.replaceAll('-', '/');

  try {
    await Deno.stat(join(opts.filesDir, filename));
    await Deno.stat(join(opts.filesDir, `${filename}.json`));
  } catch (error) {
    log.error(`[Remove] File for ${fileId} is missing`, error);
    throw createHttpError(404, 'No such file');
  }

  try {
    await Deno.rename(join(opts.filesDir, filename), join(opts.removedDir, fileId));
    await Deno.rename(join(opts.filesDir, `${filename}.json`), join(opts.removedDir, `${fileId}.json`));

    log.info(`[Remove] Successfully moved file with id ${fileId} to removed directory`);

    // TODO: Remove empty folders

    context.response.status = 200;
  } catch (error) {
    log.error(`[Remove] Failed to move file with id ${fileId} to removed directory`, error);
    throw createHttpError(500, 'Failed to remove file');
  }
};

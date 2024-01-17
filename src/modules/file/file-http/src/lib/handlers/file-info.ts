import { join } from 'std/path/mod.ts';
import { createHttpError, RouterContext } from 'oak';
import { log } from '~/src/lib/log.ts';

export type HandlerFileInfoOptions = {
  filesDir: string;
};

export const handlerFileInfo = async (context: RouterContext<string>, fileId: string, opts: HandlerFileInfoOptions) => {
  const filename = `${join(opts.filesDir, fileId.replaceAll('-', '/'))}.json`;

  try {
    await Deno.stat(filename);
  } catch (error) {
    log.error(`[Info] Metadata file for ${fileId} is missing`, error);
    throw createHttpError(404, 'No such file');
  }

  try {
    context.response.type = 'application/json';
    context.response.body = JSON.parse(await Deno.readTextFile(filename));
  } catch (error) {
    log.error(`[Info] Failed to read and parse metadata file for ${fileId}`, error);
    throw createHttpError(500, 'Failed to read file metadata');
  }
};

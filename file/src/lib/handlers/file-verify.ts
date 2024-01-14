import { join } from 'std/path/join.ts';
import { createHttpError, RouterContext } from 'oak';
import { FileMetadata } from '~/src/lib/types.ts';
import { crc32file } from '~/src/lib/crc32.ts';
import { log } from '~/src/lib/log.ts';

export type HandlerFileVerifyOptions = {
  filesDir: string;
};

export const handlerFileVerify = async (context: RouterContext<string>, fileId: string, opts: HandlerFileVerifyOptions) => {
  const filename = join(opts.filesDir, fileId.replaceAll('-', '/'));
  const metaFilename = `${filename}.json`;
  let metadata: FileMetadata;

  try {
    await Deno.stat(filename);
    await Deno.stat(metaFilename);
  } catch (error) {
    log.error(`[Remove] File for ${fileId} is missing`, error);
    throw createHttpError(404, 'No such file');
  }

  try {
    metadata = JSON.parse(await Deno.readTextFile(metaFilename));
  } catch (error) {
    log.error(`[Verify] Failed to read and parse metadata file for ${fileId}`, error);
    throw createHttpError(500, 'Failed to read file metadata');
  }

  const crc32 = await crc32file(filename);

  context.response.type = 'application/json';
  context.response.body = {
    ok: crc32 === metadata.crc32,
    type: 'crc32',
    current: crc32,
    stored: metadata.crc32,
  };
};

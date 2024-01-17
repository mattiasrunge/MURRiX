import { join } from 'std/path/join.ts';
import { createHttpError, RouterContext } from 'oak';
import { FileMetadata } from '~/src/lib/types.ts';
import { log } from '~/src/lib/log.ts';

export type HandlerFileGetOptions = {
  filesDir: string;
};

export const handlerFileGet = async (context: RouterContext<string>, fileId: string, opts: HandlerFileGetOptions) => {
  const filename = join(opts.filesDir, fileId.replaceAll('-', '/'));
  const metaFilename = `${filename}.json`;
  let metadata: FileMetadata;

  try {
    metadata = JSON.parse(await Deno.readTextFile(metaFilename)) as FileMetadata;
  } catch (error) {
    log.error(`[Get] Metadata file for ${fileId} is missing`, error);
    throw createHttpError(500, 'Failed to read file metadata');
  }

  if (context.request.method === 'HEAD') {
    context.response.status = 200;
    context.response.headers.set('Content-Length', `${metadata.size}`);
  } else {
    await context.send({
      root: opts.filesDir,
      path: fileId.replaceAll('-', '/'),
    });
  }

  context.response.headers.set('Accept-Ranges', 'bytes');
  context.response.headers.set('Last-Modified', new Date(metadata.commitedAt).toUTCString());
  context.response.headers.set('Content-Type', metadata.type);
  context.response.headers.set('Content-Disposition', `filename=${encodeURIComponent(metadata.filename)}`);
  context.response.headers.set('Checksum', `crc32=${metadata.crc32}`);
};

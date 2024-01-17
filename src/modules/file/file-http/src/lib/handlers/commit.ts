import { join } from 'std/path/mod.ts';
import { createHttpError, RouterContext } from 'oak';
import { commit } from '~/src/lib/commit.ts';
import { log } from '~/src/lib/log.ts';

export type HandlerCommitOptions = {
  stagingDir: string;
  filesDir: string;
  maxIdIterations: number;
};

export const handlerCommit = async (context: RouterContext<string>, stagedId: string, ownerId: string | null, opts: HandlerCommitOptions) => {
  const stagedFile = join(opts.stagingDir, stagedId);
  const stagedMetaFile = join(opts.stagingDir, `${stagedId}.json`);

  if (!ownerId) {
    throw createHttpError(400, 'Missing owner-id header');
  }

  try {
    await Deno.stat(stagedFile);
  } catch {
    throw createHttpError(404, 'Unknown staged file id');
  }

  let stagedMetadata: { metadata: { filename: string; type: string } };

  try {
    stagedMetadata = JSON.parse(await Deno.readTextFile(stagedMetaFile));
  } catch (error) {
    log.error(`[Commit] Failed to read and parse staged metadata file, ${stagedMetaFile}`, error);
    throw createHttpError(500, 'Failed to read staged file metadata');
  }

  if (!stagedMetadata?.metadata?.filename) {
    log.error(`[Commit] Staged file ${stagedFile} is missing filename from metadata`);
    throw createHttpError(500, 'Corrupt staged file metadata');
  }

  try {
    const metadata = await commit(stagedFile, {
      ownerId,
      filename: stagedMetadata.metadata.filename,
      filesDir: opts.filesDir,
      maxIdIterations: opts.maxIdIterations,
    });

    log.info(`[Commit] ${stagedFile} committed as ${metadata.id}: ownerId=${metadata.ownerId}, crc32=${metadata.crc32}, size=${metadata.size}`);

    try {
      await Deno.remove(stagedMetaFile);
    } catch (error) {
      log.error(`[Commit] Failed to remove staged metadata file, ${stagedMetaFile}`, error);
    }

    context.response.type = 'application/json';
    context.response.body = metadata;
  } catch (error) {
    log.error(`[Commit] Failed to commit staged file ${stagedFile}`, error);
    throw createHttpError(500, 'Failed to commit file');
  }
};

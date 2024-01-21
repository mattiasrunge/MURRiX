import { dirname, join } from 'std/path/mod.ts';
import { log } from '~/src/shared/log/mod.ts';
import { FS } from '~/src/external/fs/mod.ts';
import { FileMetadata } from '../types.ts';
import { getMimetype, getSha256, resolveFilename } from '../utils/mod.ts';
import { getStagedFilename } from './get-staged-filename.ts';

export type HandlerCommitOptions = {
  stagingDir: string;
  filesDir: string;
  maxIdIterations: number;
};

const generateId = async () => {
  return crypto.randomUUID().split('-').slice(1, 4).join('-');
};

const getFreeId = async (targetDir: string, maxIdIterations: number) => {
  let id: string;
  let idCounter = 0;

  while (true) {
    id = await generateId();
    const filename = join(targetDir, id.replaceAll('-', '/'));

    try {
      await Deno.stat(filename);
    } catch {
      break;
    }

    idCounter++;

    if (idCounter >= maxIdIterations) {
      throw new Error(`Could not find a unique id after ${idCounter} iterations`);
    }
  }

  return id;
};

export const commit = async (fs: FS, stagedId: string, ownerId: string, area: string, maxIdIterations = 1000) => {
  const targetDir = fs.getNamedPath(area);
  const stagedFile = join(fs.getStagedPath(), stagedId);
  const stagedMetaFile = join(fs.getStagedPath(), `${stagedId}.json`);
  const filename = await getStagedFilename(fs, stagedId);
  const stat = await Deno.stat(stagedFile);
  const mimetype = await getMimetype(stagedFile);
  const id = await getFreeId(targetDir, maxIdIterations);

  const metadata: FileMetadata = {
    id,
    ownerId,
    filename,
    sha256: await getSha256(stagedFile),
    size: stat.size,
    mimetype,
    commitedAt: new Date().toISOString(),
  };

  const targetFile = resolveFilename(fs, id, area);

  await Deno.mkdir(dirname(targetFile), { recursive: true });
  await Deno.writeTextFile(`${targetFile}.json`, JSON.stringify(metadata, null, 2));
  await Deno.rename(stagedFile, targetFile);

  try {
    await Deno.remove(stagedMetaFile);
  } catch (error) {
    log.error(`[Commit] Failed to remove staged metadata file, ${stagedMetaFile}`, error);
  }

  log.info(`[Commit] ${stagedFile} committed as ${metadata.id}: ownerId=${metadata.ownerId}, sha256=${metadata.sha256}, size=${metadata.size}`);

  return metadata;
};

import { dirname, join } from 'std/path/mod.ts';
import { crc32file } from '~/src/lib/crc32.ts';
import { FileMetadata } from '~/src/lib/types.ts';
import { getMimetype } from '~/src/lib/get-mimetype.ts';
import { generateId } from '~/src/lib/generate-id.ts';

export type CommitOptions = {
  ownerId: string;
  filename: string;
  filesDir: string;
  maxIdIterations: number;
};

export const commit = async (stagedFile: string, opts: CommitOptions) => {
  const stat = await Deno.stat(stagedFile);
  let id: string;
  let idCounter = 0;

  while (true) {
    id = await generateId();
    const filename = join(opts.filesDir, id.replaceAll('-', '/'));

    try {
      await Deno.stat(filename);
    } catch {
      break;
    }

    idCounter++;

    if (idCounter >= opts.maxIdIterations) {
      throw new Error(`Could not find a unique id after ${idCounter} iterations`);
    }
  }

  const metadata: FileMetadata = {
    id,
    ownerId: opts.ownerId,
    filename: opts.filename,
    crc32: await crc32file(stagedFile),
    size: stat.size,
    type: await getMimetype(stagedFile),
    commitedAt: new Date().toISOString(),
  };

  const targetFile = join(opts.filesDir, id.replaceAll('-', '/'));

  await Deno.mkdir(dirname(targetFile), { recursive: true });
  await Deno.writeTextFile(`${targetFile}.json`, JSON.stringify(metadata, null, 2));
  await Deno.rename(stagedFile, targetFile);

  return metadata;
};

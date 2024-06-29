import { run } from '~/src/shared/run/mod.ts';
import { JSONValue } from '~/src/shared/types.ts';

/**
 * Retrieves the raw metadata of a file using exiftool.
 *
 * @param filename - The name of the file to retrieve metadata from.
 * @returns A promise that resolves to the raw metadata as a JSON object.
 */
export const getRawMetadata = async (filename: string) => {
  const args = [
    '-n',
    '-j',
    '-api',
    'LargeFileSupport=1',
    '-exclude',
    'Directory',
    filename,
  ];

  const stdout = await run('exiftool', args);
  const data = JSON.parse(stdout);
  const raw = data[0] as Record<string, JSONValue>;

  // It is not possible to exclude SourceFile but it
  // will include the directory as an absolute path
  // which makes it difficult for testing and might
  // expode information that is not wanted.
  delete raw.SourceFile;

  return raw;
};

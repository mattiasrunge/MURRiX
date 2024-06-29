import { run } from '~/src/shared/run/mod.ts';

/**
 * Retrieves the MIME type of a file using file.
 *
 * @param filename - The name of the file.
 * @returns A promise that resolves to the MIME type of the file.
 */
export const getMimetypeFromFile = async (filename: string) => {
  const args = [
    '-b',
    '-L',
    '--mime-type',
    filename,
  ];

  const stdout = await run('file', args);
  return stdout.replace(/\n/g, '');
};

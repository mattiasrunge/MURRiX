import { run } from '~/src/shared/run/mod.ts';

/**
 * Retrieves the MIME type of a file using Exiftool.
 *
 * @param filename - The name of the file.
 * @returns A Promise that resolves to the MIME type of the file.
 */
export const getMimetypeFromExiftool = async (filename: string) => {
  const args = [
    '-s3',
    '-MIMEType',
    '-api',
    'LargeFileSupport=1',
    filename,
  ];

  const stdout = await run('exiftool', args);
  return stdout.replace(/\n/g, '');
};

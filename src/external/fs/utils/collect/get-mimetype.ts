import { log } from '~/src/shared/log/mod.ts';
import { getMimetypeFromExiftool } from './get-mimetype-from-exiftool.ts';
import { getMimetypeFromFile } from './get-mimetype-from-file.ts';

const DEFAULT_MIMETYPE = 'application/octet-stream';

/**
 * Retrieves the mimetype of a file.
 *
 * @param filename - The name of the file.
 * @returns The mimetype of the file.
 */
export const getMimetype = async (filename: string) => {
  const types = [
    DEFAULT_MIMETYPE,
  ];

  try {
    types.push(await getMimetypeFromExiftool(filename));
  } catch (error) {
    log.warn('Exiftool mimetype failed', error);
  }

  try {
    types.push(await getMimetypeFromFile(filename));
  } catch (error) {
    log.warn('File mimetype failed', error);
  }

  types.sort((a, b) => {
    if (a === DEFAULT_MIMETYPE) {
      return 1;
    } else if (b === DEFAULT_MIMETYPE) {
      return -1;
    }

    return 0;
  });

  return types[0];
};

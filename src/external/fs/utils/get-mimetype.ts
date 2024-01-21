import { run } from '~/src/shared/run/mod.ts';
import { log } from '~/src/shared/log/mod.ts';

const DEFAULT_MIMETYPE = 'application/octet-stream';

const getMimetypeFromExiftool = async (filename: string) => {
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

const getMimetypeFromFile = async (filename: string) => {
  const args = [
    '-b',
    '-L',
    '--mime-type',
    filename,
  ];

  const stdout = await run('file', args);
  return stdout.replace(/\n/g, '');
};

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

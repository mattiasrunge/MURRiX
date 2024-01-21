import { run } from '~/src/shared/run/mod.ts';
import { FS } from '~/src/external/fs/mod.ts';
import { resolveFilename } from '../utils/mod.ts';

export const getMetadataRaw = async (fs: FS, id: string, area: string) => {
  const filename = resolveFilename(fs, id, area);

  const args = [
    '-n',
    '-j',
    '-api',
    'LargeFileSupport=1',
    filename,
  ];

  const stdout = await run('exiftool', args);

  const data = JSON.parse(stdout);

  return data[0];
};

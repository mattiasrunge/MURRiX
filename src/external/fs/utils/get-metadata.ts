import { run } from '~/src/shared/run/mod.ts';
import { JSONValue } from '~/src/shared/types.ts';

export const getMetadata = async (filename: string) => {
  const args = [
    '-n',
    '-j',
    '-api',
    'LargeFileSupport=1',
    filename,
  ];

  const stdout = await run('exiftool', args);

  const data = JSON.parse(stdout);

  return data[0] as Record<string, JSONValue>;
};

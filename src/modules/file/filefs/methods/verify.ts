import { join } from 'std/path/join.ts';
import { FS } from '~/src/external/fs/mod.ts';
import { FileVerificationResult } from '../types.ts';
import { getSha256, resolveFilename } from '../utils/mod.ts';
import { getInfo } from './get-info.ts';

export const verify = async (fs: FS, id: string, area: string) => {
  const info = await getInfo(fs, id, area);
  const filename = resolveFilename(fs, id, area);
  const sha256 = await getSha256(filename);

  return {
    ok: sha256 === info.sha256,
    type: 'sha256',
    expected: info.sha256,
    actual: sha256,
  } as FileVerificationResult;
};

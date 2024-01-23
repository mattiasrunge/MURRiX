import { FSFileMeta } from '~/src/external/fs/mod.ts';
import { NodeAttrs } from '~/src/modules/node/mod.ts';

export type FileAttrs = NodeAttrs & {
  name: string;
  description?: string | null;
  when?: any; // TODO:
  where?: any; // TODO
  who?: any; // TODO
  area: string;
  fileId: string;
  mimetype: string;
  size: number;
  sha256: string;
  meta: FSFileMeta;
};

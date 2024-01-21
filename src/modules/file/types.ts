import { NodeAttrs } from '~/src/modules/node/mod.ts';
import { FileMeta } from '~/src/modules/file/filefs/mod.ts';

export type FileAttrs = NodeAttrs & {
  title: string;
  description?: string | null;
  when?: any; // TODO:
  where?: any; // TODO
  who?: any; // TODO
  area: string;
  fileId: string;
  mimetype: string;
  size: number;
  sha256: string;
  meta?: FileMeta;
};

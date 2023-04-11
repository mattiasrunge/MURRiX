import { Access, NodeFS } from '~/layers/2_nodefs/mod.ts';

export type Client = {
  access: Access;
  nodefs: NodeFS;
};

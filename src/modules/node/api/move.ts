import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { collection, NodeData, nodefs, NodePath } from '../nodefs/mod.ts';

type I = {
  access: Access;
  srcPath: NodePath;
  dstPath: NodePath;
  inheritRights?: boolean;
};

type O = NodeData;

export const move = api<I, O>(
  async (service: ServiceIf, { access, srcPath, dstPath, inheritRights }: I) => {
    const col = collection(service);
    return await nodefs.move(col, access, srcPath, dstPath, inheritRights);
  },
);

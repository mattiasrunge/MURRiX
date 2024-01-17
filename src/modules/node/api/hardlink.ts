import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { collection, NodeData, nodefs, NodePath } from '../nodefs/mod.ts';

type I = {
  access: Access;
  path: NodePath;
  targetPath: NodePath;
};

type O = NodeData;

export const hardlink = api<I, O>(
  async (service: ServiceIf, { access, path, targetPath }: I) => {
    const col = collection(service);
    return await nodefs.hardlink(col, access, path, targetPath);
  },
);

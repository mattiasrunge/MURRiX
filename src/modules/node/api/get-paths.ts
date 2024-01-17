import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { collection, nodefs, NodeId, NodePath } from '../nodefs/mod.ts';

type I = {
  access: Access;
  id: NodeId;
};

type O = NodePath[];

export const getPaths = api<I, O>(
  async (service: ServiceIf, { access, id }: I) => {
    const col = collection(service);
    return await nodefs.resolvePaths(col, access, id);
  },
);

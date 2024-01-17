import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { collection, nodefs, NodePath } from '../nodefs/mod.ts';

type I = {
  access: Access;
  path: NodePath;
};

type O = boolean;

export const remove = api<I, O>(
  async (service: ServiceIf, { access, path }: I) => {
    const col = collection(service);
    return await nodefs.remove(col, access, path);
  },
);

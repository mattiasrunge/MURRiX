import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { collection, nodefs, NodePath } from '../nodefs/mod.ts';

type I = {
  access: Access;
  path: NodePath;
  name: string;
};

type O = string;

export const uniqueName = api<I, O>(
  async (service: ServiceIf, { access, path, name }: I) => {
    const col = collection(service);
    return await nodefs.uniqueName(col, access, path, name);
  },
);

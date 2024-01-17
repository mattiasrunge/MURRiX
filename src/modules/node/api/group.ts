import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { collection, NodeData, nodefs, NodePath } from '../nodefs/mod.ts';

type I = {
  access: Access;
  path: NodePath;
  group: string | null;
};

type O = NodeData;

export const group = api<I, O>(
  async (service: ServiceIf, { access, path, group }: I) => {
    const col = collection(service);
    const { _id } = await nodefs.resolveOne(col, access, path, {
      readlink: true,
    });

    return await nodefs.setProps(col, access, _id, { group });
  },
);

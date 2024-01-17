import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { collection, NodeAttrs, NodeData, nodefs, NodePath } from '../nodefs/mod.ts';

type I = {
  access: Access;
  path: NodePath;
  attrs: NodeAttrs;
};

type O = NodeData;

export const update = api<I, O>(
  async (service: ServiceIf, { access, path, attrs }: I) => {
    const col = collection(service);
    const nodeData = await nodefs.resolveOne(col, access, path, {
      readlink: true,
    });

    return await nodefs.setAttrs(col, access, nodeData._id, attrs);
  },
);

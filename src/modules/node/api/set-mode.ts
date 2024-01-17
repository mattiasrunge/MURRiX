import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { Mode } from '~/src/shared/mode/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { collection, NodeData, nodefs, NodePath } from '../nodefs/mod.ts';

type I = {
  access: Access;
  path: NodePath;
  mode: Mode;
  recursive?: boolean;
};

type O = NodeData;

export const setMode = api<I, O>(
  async (service: ServiceIf, { access, path, mode, recursive }: I) => {
    const col = collection(service);
    const { _id } = await nodefs.resolveOne(col, access, path, {
      readlink: true,
    });

    return await nodefs.setProps(col, access, _id, { mode }, {
      recursive,
    });
  },
);

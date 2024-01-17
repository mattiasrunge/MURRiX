import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { collection, NamedNodeData, nodefs, NodePath, NodeResolveOptions } from '../nodefs/mod.ts';

type I = {
  access: Access;
  path: NodePath;
  options?: NodeResolveOptions;
};

type O = NamedNodeData;

export const resolveOne = api<I, O>(
  async (service: ServiceIf, { access, path, options }: I) => {
    const col = collection(service);
    return await nodefs.resolveOne(col, access, path, options);
  },
);

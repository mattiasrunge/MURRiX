import { Access, NamedNodeData, NodePath, NodeResolveOptions } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';

type I = {
  access: Access;
  path: NodePath;
  options?: NodeResolveOptions;
};

type O = NamedNodeData[];

export const resolve = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, path, options }: I) => {
    return await api.nodefs.resolve(access, path, options);
  },
);

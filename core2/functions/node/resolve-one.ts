import { Access, NamedNodeData, NodeAttrs, NodePath, NodeResolveOptions } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';

type I = {
  access: Access;
  path: NodePath;
  options?: NodeResolveOptions;
};

type O = NamedNodeData;

export const resolveOne = wrap<I, O>(
  import.meta.url,
  async <T extends NodeAttrs = NodeAttrs>(api: API, { access, path, options }: I) => {
    return await api.nodefs.resolveOne<T>(access, path, options);
  },
);

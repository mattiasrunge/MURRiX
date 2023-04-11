import { Access, NamedNodeData, NodePath, NodeResolveOptions } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';

type I = {
  access: Access;
  path: NodePath;
  options?: NodeResolveOptions;
};

type O = NamedNodeData;

export const resolveOne = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, path, options }: I) => {
    return await api.nodefs.resolveOne(access, path, options);
  },
);

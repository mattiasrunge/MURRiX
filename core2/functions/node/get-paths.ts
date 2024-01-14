import { Access, NodeId, NodePath } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';

type I = {
  access: Access;
  id: NodeId;
};

type O = NodePath[];

export const getPaths = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, id }: I) => {
    return await api.nodefs.resolvePaths(access, id);
  },
);

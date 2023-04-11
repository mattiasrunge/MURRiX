import { Access, NodePath } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';

type I = {
  access: Access;
  path: NodePath;
};

type O = NodePath[];

export const paths = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, path }: I) => {
    return await api.nodefs.resolvePaths(access, path);
  },
);

import { Access, NodePath, utils } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';

type I = {
  access: Access;
  path: NodePath;
};

type O = boolean;

export const remove = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, path }: I) => {
    return await utils.remove(api.nodefs, access, path);
  },
);

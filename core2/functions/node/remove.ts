import { Access, NodePath, utils } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';

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

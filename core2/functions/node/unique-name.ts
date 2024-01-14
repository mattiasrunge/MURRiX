import { Access, NodePath, utils } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';

type I = {
  access: Access;
  path: NodePath;
  name: string;
};

type O = string;

export const uniqueName = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, path, name }: I) => {
    return await utils.uniqueName(api.nodefs, access, path, name);
  },
);

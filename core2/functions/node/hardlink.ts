import { Access, NodeData, NodePath, utils } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';

type I = {
  access: Access;
  path: NodePath;
  targetPath: NodePath;
};

type O = NodeData;

export const hardlink = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, path, targetPath }: I) => {
    return await utils.hardlink(api.nodefs, access, path, targetPath);
  },
);

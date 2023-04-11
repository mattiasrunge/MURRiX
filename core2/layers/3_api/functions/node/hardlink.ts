import { Access, NodeData, NodePath, utils } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';

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

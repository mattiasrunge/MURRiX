import { Access, NodeData, NodePath, utils } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';

type I = {
  access: Access;
  srcPath: NodePath;
  dstPath: NodePath;
  inheritRights?: boolean;
};

type O = NodeData;

export const move = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, srcPath, dstPath, inheritRights }: I) => {
    return await utils.move(api.nodefs, access, srcPath, dstPath, inheritRights);
  },
);

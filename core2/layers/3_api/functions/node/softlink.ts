import { Access, NodeAttrs, NodeData, NodePath, PartialNodeProps, utils } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';

type I = {
  access: Access;
  path: NodePath;
  targetPath: NodePath;
  type: string;
  attrs?: NodeAttrs;
  props?: PartialNodeProps;
};

type O = NodeData;

export const softlink = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, path, targetPath, type, attrs, props }: I) => {
    return await utils.softlink(api.nodefs, access, path, targetPath, type, attrs, props);
  },
);

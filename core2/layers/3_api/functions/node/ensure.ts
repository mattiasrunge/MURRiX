import { Access, NamedNodeData, NodeAttrs, NodePath, PartialNodeProps, utils } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';

type I = {
  access: Access;
  path: NodePath;
  type: string;
  attrs?: NodeAttrs;
  props?: PartialNodeProps;
};

type O = NamedNodeData;

export const ensure = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, path, type, attrs, props }: I) => {
    try {
      return await api.nodefs.resolveOne(access, path);
    } catch {
      return await utils.make(api.nodefs, access, path, type, attrs, props);
    }
  },
);

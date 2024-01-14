import { Access, NamedNodeData, NodeAttrs, NodePath, PartialNodeProps, utils } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { resolveOne } from './resolve-one.ts';

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
      return await resolveOne(api, { access, path });
    } catch {
      return await utils.make(api.nodefs, access, path, type, attrs, props);
    }
  },
);

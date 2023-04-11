import { Access, NodeAttrs, NodeData, NodePath } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';

type I = {
  access: Access;
  path: NodePath;
  attrs: NodeAttrs;
};

type O = NodeData;

export const update = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, path, attrs }: I) => {
    const nodeData = await api.nodefs.resolveOne(access, path, { readlink: true });

    return await api.nodefs.setAttrs(access, nodeData._id, attrs);
  },
);

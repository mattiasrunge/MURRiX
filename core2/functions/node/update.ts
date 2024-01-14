import { Access, NodeAttrs, NodeData, NodePath } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { resolveOne } from './resolve-one.ts';

type I = {
  access: Access;
  path: NodePath;
  attrs: NodeAttrs;
};

type O = NodeData;

export const update = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, path, attrs }: I) => {
    const nodeData = await resolveOne(api, {
      access,
      path,
      options: { readlink: true },
    });

    return await api.nodefs.setAttrs(access, nodeData._id, attrs);
  },
);

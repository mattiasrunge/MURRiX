import { Access, AccessMode, NodeData, NodePath } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';

type I = {
  access: Access;
  path: NodePath;
  mode: AccessMode;
  recursive?: boolean;
};

type O = NodeData;

export const setMode = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, path, mode, recursive }: I) => {
    const { _id } = await api.nodefs.resolveOne(access, path, { readlink: true });

    return await api.nodefs.setProps(access, _id, { mode }, {
      recursive,
    });
  },
);

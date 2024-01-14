import { Mode } from '~/lib/mode/mod.ts';
import { Access, NodeData, NodePath } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { resolveOne } from './resolve-one.ts';

type I = {
  access: Access;
  path: NodePath;
  mode: Mode;
  recursive?: boolean;
};

type O = NodeData;

export const setMode = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, path, mode, recursive }: I) => {
    const { _id } = await resolveOne(api, {
      access,
      path,
      options: { readlink: true },
    });

    return await api.nodefs.setProps(access, _id, { mode }, {
      recursive,
    });
  },
);

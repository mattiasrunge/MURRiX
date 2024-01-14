import { Access, NodeData, NodePath } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { resolveOne } from './resolve-one.ts';

type I = {
  access: Access;
  path: NodePath;
  group: string | null;
};

type O = NodeData;

export const group = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, path, group }: I) => {
    const { _id } = await resolveOne(api, {
      access,
      path,
      options: { readlink: true },
    });

    return await api.nodefs.setProps(access, _id, { group });
  },
);

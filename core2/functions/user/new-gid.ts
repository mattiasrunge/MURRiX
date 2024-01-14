import { Access, GroupId, NamedNodeData } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { node } from '~/functions/node.ts';
import { GroupAttrs } from './types.ts';

type I = {
  access: Access;
};

type O = GroupId;

export const newGid = wrap<I, O>(
  import.meta.url,
  async (api: API, { access }: I) => {
    const groups = await node.resolve(api, {
      access,
      path: '/groups/*',
    }) as NamedNodeData<GroupAttrs>[];
    const gids = groups.map((group) => group.attrs.gid);

    return Math.max(0, ...gids) + 1;
  },
);

import { Access, GroupId } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';
import { GroupAttrs } from './types.ts';

type I = {
  access: Access;
};

type O = GroupId;

export const newGid = wrap<I, O>(
  import.meta.url,
  async (api: API, { access }: I) => {
    const groups = await api.nodefs.resolve<GroupAttrs>(access, '/groups/*');
    const gids = groups.map((group) => group.attrs.gid);

    return Math.max(0, ...gids) + 1;
  },
);

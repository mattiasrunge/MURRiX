import { Access, ADMIN_GROUPNAME, ADMIN_USERNAME, GUEST_GROUPNAME, GUEST_USERNAME, utils } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';

type I = {
  access: Access;
  group: string;
  user: string;
};

type O = boolean;

export const leave = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, group, user }: I) => {
    if (group === ADMIN_GROUPNAME && user === ADMIN_USERNAME) {
      throw new Error('admin cannot leave admin group');
    }

    if (group === GUEST_GROUPNAME && user === GUEST_USERNAME) {
      throw new Error('guest cannot leave guest group');
    }

    // This link is grouped so there is no need to remove more than
    // one end, thus `/groups/${group}/users/${user}` will be automatically
    // removed when `/users/${user}/groups/${group}` is removed.
    await utils.remove(api.nodefs, access, `/users/${user}/groups/${group}`);

    return true;
  },
);

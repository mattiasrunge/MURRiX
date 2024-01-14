import { Access, ADMIN_GROUPNAME, ADMIN_USERNAME, GUEST_GROUPNAME, GUEST_USERNAME } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { node } from '~/functions/node.ts';

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
    await node.remove(api, {
      access,
      path: `/users/${user}/groups/${group}`,
    });

    return true;
  },
);

import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { Access, ADMIN_GROUPNAME, ADMIN_USERNAME, GUEST_GROUPNAME, GUEST_USERNAME } from '~/src/shared/access/mod.ts';
import { nodeApi } from '~/src/modules/node/mod.ts';

type I = {
  access: Access;
  group: string;
  user: string;
};

type O = boolean;

export const leave = api<I, O>(
  async (service: ServiceIf, { access, group, user }: I) => {
    if (group === ADMIN_GROUPNAME && user === ADMIN_USERNAME) {
      throw new Error('admin cannot leave admin group');
    }

    if (group === GUEST_GROUPNAME && user === GUEST_USERNAME) {
      throw new Error('guest cannot leave guest group');
    }

    // This link is grouped so there is no need to remove more than
    // one end, thus `/groups/${group}/users/${user}` will be automatically
    // removed when `/users/${user}/groups/${group}` is removed.
    await nodeApi.remove(service, {
      access,
      path: `/users/${user}/groups/${group}`,
    });

    return true;
  },
);

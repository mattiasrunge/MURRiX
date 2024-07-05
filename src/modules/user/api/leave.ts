import { ADMIN_GROUPNAME, ADMIN_USERNAME, GUEST_GROUPNAME, GUEST_USERNAME } from '~/src/shared/access/mod.ts';
import { nodeApi } from '~/src/modules/node/mod.ts';
import { ApiIf } from '../api.ts';

export const leave: ApiIf['leave'] = async (service, { access, group, user }) => {
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
};

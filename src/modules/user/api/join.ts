import { GUEST_GROUPNAME, GUEST_USERNAME } from '~/src/shared/access/mod.ts';
import { nodeApi } from '~/src/modules/node/mod.ts';
import { ApiIf } from '../api.ts';

export const join: ApiIf['join'] = async (service, { access, group, user }) => {
  const nodeGroupId = crypto.randomUUID();

  if (user === GUEST_USERNAME && group !== GUEST_GROUPNAME) {
    throw new Error('guest cannot join any group other than the guest group');
  }

  await nodeApi.softlink(service, {
    access,
    path: `/users/${user}/groups/${group}`,
    targetPath: `/groups/${group}`,
    type: 's',
    props: {
      group: nodeGroupId,
    },
  });

  await nodeApi.softlink(service, {
    access,
    path: `/groups/${group}/users/${user}`,
    targetPath: `/users/${user}`,
    type: 's',
    props: {
      group: nodeGroupId,
    },
  });

  return true;
};

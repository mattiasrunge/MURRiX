import { GUEST_GROUPNAME, GUEST_USERNAME } from '~/src/shared/access/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { ServiceIf } from '~/src/shared/service/types.ts';
import { apiNode } from '~/src/modules/node/mod.ts';
import { ApiIf } from '../if.ts';

export const join: ApiIf['join'] = async (ctx: ApiContext<ServiceIf>, { group, user }) => {
  const nodeGroupId = crypto.randomUUID();

  if (user === GUEST_USERNAME && group !== GUEST_GROUPNAME) {
    throw new Error('guest cannot join any group other than the guest group');
  }

  await apiNode.softlink(ctx, {
    path: `/users/${user}/groups/${group}`,
    targetPath: `/groups/${group}`,
    type: 's',
    props: {
      group: nodeGroupId,
    },
  });

  await apiNode.softlink(ctx, {
    path: `/groups/${group}/users/${user}`,
    targetPath: `/users/${user}`,
    type: 's',
    props: {
      group: nodeGroupId,
    },
  });

  return true;
};

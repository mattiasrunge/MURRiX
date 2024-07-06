import { ServiceIf } from '~/src/shared/service/mod.ts';
import { CUSTODIANS_GID, USERS_GID } from '~/src/shared/access/mod.ts';
import { getMode, MaskACL } from '~/src/shared/mode/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { apiNode } from '~/src/modules/node/mod.ts';

export const init = async (ctx: ApiContext<ServiceIf>) => {
  // Create folders
  await apiNode.ensure(ctx, {
    path: '/people',
    type: 'd',
    props: {
      mode: 0o770,
      gid: USERS_GID,
      acl: [
        {
          mode: getMode('rwx', MaskACL),
          gid: CUSTODIANS_GID,
        },
      ],
    },
  });

  return true;
};

import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { nodeApi } from '~/src/modules/node/mod.ts';
import { ADMIN_ACCESS, CUSTODIANS_GID, USERS_GID } from '~/src/shared/access/mod.ts';
import { getMode, MaskACL } from '~/src/shared/mode/mod.ts';

type I = Record<string, never>;

type O = boolean;

export const init = api<I, O>(
  async (service: ServiceIf, {}: I) => {
    // Create folders
    await nodeApi.ensure(service, {
      access: ADMIN_ACCESS,
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
  },
);

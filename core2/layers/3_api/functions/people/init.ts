import { ADMIN_ACCESS, CUSTODIANS_GID, getMode, MaskACL, USERS_GID } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';
import * as node from '../node/mod.ts';

type I = Record<string, never>;

type O = boolean;

export const init = wrap<I, O>(
  import.meta.url,
  async (api: API, {}: I) => {
    // Create folders
    await node.ensure(api, {
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

import {
  ADMIN_ACCESS,
  ADMIN_GID,
  ADMIN_GROUPNAME,
  ADMIN_UID,
  ADMIN_USERNAME,
  CUSTODIANS_GID,
  CUSTODIANS_GROUPNAME,
  GUEST_GID,
  GUEST_GROUPNAME,
  GUEST_UID,
  GUEST_USERNAME,
  USERS_GID,
  USERS_GROUPNAME,
} from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';
import * as node from '../node/mod.ts';
import { makeGroup } from './make-group.ts';
import { makeUser } from './make-user.ts';
import { join } from './join.ts';

type I = Record<string, never>;

type O = boolean;

export const init = wrap<I, O>(
  import.meta.url,
  async (api: API, {}: I) => {
    // Create folders
    await node.ensure(api, {
      access: ADMIN_ACCESS,
      path: '/users',
      type: 'd',
      props: {
        mode: 0o771,
      },
    });
    await node.ensure(api, {
      access: ADMIN_ACCESS,
      path: '/groups',
      type: 'd',
      props: {
        mode: 0o771,
      },
    });

    // Create admin group
    if (!(await node.exists(api, { access: ADMIN_ACCESS, path: `/groups/${ADMIN_GROUPNAME}` }))) {
      await api.nodefs.phy.common.log.info('No admin group found, creating...');
      await makeGroup(api, {
        access: ADMIN_ACCESS,
        name: ADMIN_GROUPNAME,
        description: 'Group for administrators',
        title: 'Administators',
        gid: ADMIN_GID,
      });
    }

    // Create guest group
    if (!(await node.exists(api, { access: ADMIN_ACCESS, path: `/groups/${GUEST_GROUPNAME}` }))) {
      await api.nodefs.phy.common.log.info('No guest group found, creating...');
      await makeGroup(api, {
        access: ADMIN_ACCESS,
        name: GUEST_GROUPNAME,
        description: 'Group for guests',
        title: 'Guests',
        gid: GUEST_GID,
      });
    }

    // Create users group
    if (!(await node.exists(api, { access: ADMIN_ACCESS, path: `/groups/${USERS_GROUPNAME}` }))) {
      await api.nodefs.phy.common.log.info('No users group found, creating...');
      await makeGroup(api, {
        access: ADMIN_ACCESS,
        name: USERS_GROUPNAME,
        description: 'Group for users',
        title: 'Users',
        gid: USERS_GID,
      });
    }

    // Create custodian group
    if (!(await node.exists(api, { access: ADMIN_ACCESS, path: `/groups/${CUSTODIANS_GROUPNAME}` }))) {
      await api.nodefs.phy.common.log.info('No custodians group found, creating...');
      await makeGroup(api, {
        access: ADMIN_ACCESS,
        name: CUSTODIANS_GROUPNAME,
        description: 'Group for custodians',
        title: 'Custodians',
        gid: CUSTODIANS_GID,
      });
    }

    // Create admin user
    if (!(await node.exists(api, { access: ADMIN_ACCESS, path: `/users/${ADMIN_USERNAME}` }))) {
      await api.nodefs.phy.common.log.info('No admin user found, creating...');

      const passwordId = await api.nodefs.setPassword(ADMIN_USERNAME);
      await makeUser(api, {
        access: ADMIN_ACCESS,
        name: ADMIN_USERNAME,
        uid: ADMIN_UID,
        title: 'Administrator',
        passwordId,
      });

      await join(api, {
        access: ADMIN_ACCESS,
        group: ADMIN_GROUPNAME,
        user: ADMIN_USERNAME,
      });
    }

    // Create guest user
    if (!(await node.exists(api, { access: ADMIN_ACCESS, path: `/users/${GUEST_USERNAME}` }))) {
      await api.nodefs.phy.common.log.info('No guest user found, creating...');
      await makeUser(api, {
        access: ADMIN_ACCESS,
        name: GUEST_USERNAME,
        uid: GUEST_UID,
        title: 'Guest',
      });

      await join(api, {
        access: ADMIN_ACCESS,
        group: GUEST_GROUPNAME,
        user: GUEST_USERNAME,
      });
    }

    return true;
  },
);

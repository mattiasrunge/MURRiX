import { nodeApi } from '~/src/modules/node/mod.ts';
import { api, ServiceIf } from '~/src/shared/service/mod.ts';
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
} from '~/src/shared/access/mod.ts';
import { collection, vault } from '../vault/mod.ts';
import { makeGroup } from './make-group.ts';
import { makeUser } from './make-user.ts';
import { join } from './join.ts';

type I = Record<string, never>;

type O = boolean;

export const init = api<I, O>(
  async (service: ServiceIf, {}: I) => {
    // Create folders
    await nodeApi.ensure(service, {
      access: ADMIN_ACCESS,
      path: '/users',
      type: 'd',
      props: {
        mode: 0o771,
      },
    });
    await nodeApi.ensure(service, {
      access: ADMIN_ACCESS,
      path: '/groups',
      type: 'd',
      props: {
        mode: 0o771,
      },
    });

    // Create admin group
    if (!(await nodeApi.exists(service, { access: ADMIN_ACCESS, path: `/groups/${ADMIN_GROUPNAME}` }))) {
      await service.log.info('No admin group found, creating...');
      await makeGroup(service, {
        access: ADMIN_ACCESS,
        name: ADMIN_GROUPNAME,
        description: 'Group for administrators',
        title: 'Administators',
        gid: ADMIN_GID,
      });
    }

    // Create guest group
    if (!(await nodeApi.exists(service, { access: ADMIN_ACCESS, path: `/groups/${GUEST_GROUPNAME}` }))) {
      await service.log.info('No guest group found, creating...');
      await makeGroup(service, {
        access: ADMIN_ACCESS,
        name: GUEST_GROUPNAME,
        description: 'Group for guests',
        title: 'Guests',
        gid: GUEST_GID,
      });
    }

    // Create users group
    if (!(await nodeApi.exists(service, { access: ADMIN_ACCESS, path: `/groups/${USERS_GROUPNAME}` }))) {
      await service.log.info('No users group found, creating...');
      await makeGroup(service, {
        access: ADMIN_ACCESS,
        name: USERS_GROUPNAME,
        description: 'Group for users',
        title: 'Users',
        gid: USERS_GID,
      });
    }

    // Create custodian group
    if (!(await nodeApi.exists(service, { access: ADMIN_ACCESS, path: `/groups/${CUSTODIANS_GROUPNAME}` }))) {
      await service.log.info('No custodians group found, creating...');
      await makeGroup(service, {
        access: ADMIN_ACCESS,
        name: CUSTODIANS_GROUPNAME,
        description: 'Group for custodians',
        title: 'Custodians',
        gid: CUSTODIANS_GID,
      });
    }

    // Create admin user
    if (!(await nodeApi.exists(service, { access: ADMIN_ACCESS, path: `/users/${ADMIN_USERNAME}` }))) {
      await service.log.info('No admin user found, creating...');

      const col = collection(service);
      const passwordId = await vault.setPassword(col, ADMIN_USERNAME);
      await makeUser(service, {
        access: ADMIN_ACCESS,
        name: ADMIN_USERNAME,
        uid: ADMIN_UID,
        title: 'Administrator',
        passwordId,
      });

      await join(service, {
        access: ADMIN_ACCESS,
        group: ADMIN_GROUPNAME,
        user: ADMIN_USERNAME,
      });
    }

    // Create guest user
    if (!(await nodeApi.exists(service, { access: ADMIN_ACCESS, path: `/users/${GUEST_USERNAME}` }))) {
      await service.log.info('No guest user found, creating...');
      await makeUser(service, {
        access: ADMIN_ACCESS,
        name: GUEST_USERNAME,
        uid: GUEST_UID,
        title: 'Guest',
      });

      await join(service, {
        access: ADMIN_ACCESS,
        group: GUEST_GROUPNAME,
        user: GUEST_USERNAME,
      });
    }

    return true;
  },
);

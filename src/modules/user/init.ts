import {
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
import { ApiContext } from '~/src/shared/api/types.ts';
import { log } from '~/src/shared/log/mod.ts';
import { ServiceIf } from '~/src/shared/service/types.ts';
import { apiNode } from '~/src/modules/node/mod.ts';
import { collection, vault } from './vault/mod.ts';
import { makeGroup } from './api/fns/make-group.ts';
import { makeUser } from './api/fns/make-user.ts';
import { join } from './api/fns/join.ts';

export const init = async (ctx: ApiContext<ServiceIf>) => {
  // Create folders
  await apiNode.ensure(ctx, {
    path: '/users',
    type: 'd',
    props: {
      mode: 0o771,
    },
  });
  await apiNode.ensure(ctx, {
    path: '/groups',
    type: 'd',
    props: {
      mode: 0o771,
    },
  });

  // Create admin group
  if (!(await apiNode.exists(ctx, { path: `/groups/${ADMIN_GROUPNAME}` }))) {
    log.info('No admin group found, creating...');
    await makeGroup(ctx, {
      name: ADMIN_GROUPNAME,
      description: 'Group for administrators',
      title: 'Administators',
      gid: ADMIN_GID,
    });
  }

  // Create guest group
  if (!(await apiNode.exists(ctx, { path: `/groups/${GUEST_GROUPNAME}` }))) {
    log.info('No guest group found, creating...');
    await makeGroup(ctx, {
      name: GUEST_GROUPNAME,
      description: 'Group for guests',
      title: 'Guests',
      gid: GUEST_GID,
    });
  }

  // Create users group
  if (!(await apiNode.exists(ctx, { path: `/groups/${USERS_GROUPNAME}` }))) {
    log.info('No users group found, creating...');
    await makeGroup(ctx, {
      name: USERS_GROUPNAME,
      description: 'Group for users',
      title: 'Users',
      gid: USERS_GID,
    });
  }

  // Create custodian group
  if (!(await apiNode.exists(ctx, { path: `/groups/${CUSTODIANS_GROUPNAME}` }))) {
    log.info('No custodians group found, creating...');
    await makeGroup(ctx, {
      name: CUSTODIANS_GROUPNAME,
      description: 'Group for custodians',
      title: 'Custodians',
      gid: CUSTODIANS_GID,
    });
  }

  // Create admin user
  if (!(await apiNode.exists(ctx, { path: `/users/${ADMIN_USERNAME}` }))) {
    log.info('No admin user found, creating...');

    const col = collection(ctx.service);
    const passwordId = await vault.setPassword(col, ADMIN_USERNAME);
    await makeUser(ctx, {
      name: ADMIN_USERNAME,
      uid: ADMIN_UID,
      title: 'Administrator',
      passwordId,
    });

    await join(ctx, {
      group: ADMIN_GROUPNAME,
      user: ADMIN_USERNAME,
    });
  }

  // Create guest user
  if (!(await apiNode.exists(ctx, { path: `/users/${GUEST_USERNAME}` }))) {
    log.info('No guest user found, creating...');
    await makeUser(ctx, {
      name: GUEST_USERNAME,
      uid: GUEST_UID,
      title: 'Guest',
    });

    await join(ctx, {
      group: GUEST_GROUPNAME,
      user: GUEST_USERNAME,
    });
  }

  return true;
};

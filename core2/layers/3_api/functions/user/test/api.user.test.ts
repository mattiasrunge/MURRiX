import { assert, assertArrayIncludes, assertEquals, assertNotEquals } from 'std/testing/asserts.ts';
import { Common, Config } from '~/layers/0_common/mod.ts';
import { FullPhysical, LightPhysical } from '~/layers/1_physical/mod.ts';
import {
  Access,
  ADMIN_ACCESS,
  ADMIN_GROUPNAME,
  ADMIN_UID,
  ADMIN_USERNAME,
  CUSTODIANS_GID,
  CUSTODIANS_GROUPNAME,
  GUEST_GID,
  GUEST_GROUPNAME,
  GUEST_UID,
  GUEST_USERNAME,
  LocalNodeFS,
  RemoteNodeFS,
  USERS_GID,
  USERS_GROUPNAME,
  utils,
} from '~/layers/2_nodefs/mod.ts';
import { API } from '~/layers/3_api/mod.ts';
import { node, user } from '../../mod.ts';
import { GroupAttrs, UserAttrs } from '../types.ts';

Deno.test({
  name: 'api.user',
  fn: async (t) => {
    const config: Config = {
      fs: {
        areas: {
          'temp': await Deno.makeTempDir(),
        },
      },
      sm: {
        hostname: 'localhost',
        port: 6379,
      },
      db: {
        db: crypto.randomUUID(),
        servers: [
          {
            host: 'localhost',
            port: 27017,
          },
        ],
      },
      mq: {
        hostname: 'localhost',
        port: 5672,
      },
    };

    // Bringup

    const common = await Common.create(config);
    const fullPhy = await FullPhysical.create(common);
    const lightPhy = await LightPhysical.create(common);
    const localNodefs = await LocalNodeFS.create(fullPhy);
    const remoteNodefs = await RemoteNodeFS.create(lightPhy);
    const localApi = await API.create(localNodefs, [
      ...Object.values(node),
      ...Object.values(user),
    ]);
    const remoteApi = await API.create(remoteNodefs);

    // Test steps

    await t.step('should run init and check default users and groups', async () => {
      await node.init(remoteApi, {});
      await user.init(remoteApi, {});

      // Verify admin group
      const adminGroup = await remoteNodefs.resolveOne<GroupAttrs>(ADMIN_ACCESS, `/groups/${ADMIN_GROUPNAME}`);
      assertEquals(adminGroup.name, ADMIN_GROUPNAME);
      assertEquals(adminGroup.paths, [`/groups/${ADMIN_GROUPNAME}`]);
      assertEquals(adminGroup.type, 'g');
      assert(adminGroup.props.btime.timestamp > 0);
      assertEquals(adminGroup.props.btime.uid, ADMIN_UID);
      assert(adminGroup.props.ptime.timestamp > 0);
      assertEquals(adminGroup.props.ptime.uid, ADMIN_UID);
      assert(adminGroup.props.atime.timestamp > 0);
      assertEquals(adminGroup.props.atime.uid, ADMIN_UID);
      assertEquals(adminGroup.props.mode, 0o771);
      assertEquals(adminGroup.attrs.gid, ADMIN_UID);

      assertEquals(await utils.exists(remoteNodefs, ADMIN_ACCESS, `/groups/${ADMIN_GROUPNAME}/users`), true);

      // Verfiy guest group
      const guestGroup = await remoteNodefs.resolveOne<GroupAttrs>(ADMIN_ACCESS, `/groups/${GUEST_GROUPNAME}`);
      assertEquals(guestGroup.name, GUEST_GROUPNAME);
      assertEquals(guestGroup.paths, [`/groups/${GUEST_GROUPNAME}`]);
      assertEquals(guestGroup.type, 'g');
      assert(guestGroup.props.btime.timestamp > 0);
      assertEquals(guestGroup.props.btime.uid, ADMIN_UID);
      assert(guestGroup.props.ptime.timestamp > 0);
      assertEquals(guestGroup.props.ptime.uid, ADMIN_UID);
      assert(guestGroup.props.atime.timestamp > 0);
      assertEquals(guestGroup.props.atime.uid, ADMIN_UID);
      assertEquals(guestGroup.props.mode, 0o771);
      assertEquals(guestGroup.attrs.gid, GUEST_GID);

      assertEquals(await utils.exists(remoteNodefs, ADMIN_ACCESS, `/groups/${GUEST_GROUPNAME}/users`), true);

      // Verify users group
      const usersGroup = await remoteNodefs.resolveOne<GroupAttrs>(ADMIN_ACCESS, `/groups/${USERS_GROUPNAME}`);
      assertEquals(usersGroup.name, USERS_GROUPNAME);
      assertEquals(usersGroup.paths, [`/groups/${USERS_GROUPNAME}`]);
      assertEquals(usersGroup.type, 'g');
      assert(usersGroup.props.btime.timestamp > 0);
      assertEquals(usersGroup.props.btime.uid, ADMIN_UID);
      assert(usersGroup.props.ptime.timestamp > 0);
      assertEquals(usersGroup.props.ptime.uid, ADMIN_UID);
      assert(usersGroup.props.atime.timestamp > 0);
      assertEquals(usersGroup.props.atime.uid, ADMIN_UID);
      assertEquals(usersGroup.props.mode, 0o771);
      assertEquals(usersGroup.attrs.gid, USERS_GID);

      assertEquals(await utils.exists(remoteNodefs, ADMIN_ACCESS, `/groups/${USERS_GROUPNAME}/users`), true);

      // Verify custodians group
      const custodiansGroup = await remoteNodefs.resolveOne<GroupAttrs>(ADMIN_ACCESS, `/groups/${CUSTODIANS_GROUPNAME}`);
      assertEquals(custodiansGroup.name, CUSTODIANS_GROUPNAME);
      assertEquals(custodiansGroup.paths, [`/groups/${CUSTODIANS_GROUPNAME}`]);
      assertEquals(custodiansGroup.type, 'g');
      assert(custodiansGroup.props.btime.timestamp > 0);
      assertEquals(custodiansGroup.props.btime.uid, ADMIN_UID);
      assert(custodiansGroup.props.ptime.timestamp > 0);
      assertEquals(custodiansGroup.props.ptime.uid, ADMIN_UID);
      assert(custodiansGroup.props.atime.timestamp > 0);
      assertEquals(custodiansGroup.props.atime.uid, ADMIN_UID);
      assertEquals(custodiansGroup.props.mode, 0o771);
      assertEquals(custodiansGroup.attrs.gid, CUSTODIANS_GID);

      assertEquals(await utils.exists(remoteNodefs, ADMIN_ACCESS, `/groups/${CUSTODIANS_GROUPNAME}/users`), true);

      // Verify admin user
      const adminUser = await remoteNodefs.resolveOne<UserAttrs>(ADMIN_ACCESS, `/users/${ADMIN_USERNAME}`);
      assertEquals(adminUser.name, ADMIN_USERNAME);
      assertEquals(adminUser.paths, [`/users/${ADMIN_USERNAME}`]);
      assertEquals(adminUser.type, 'u');
      assert(adminUser.props.btime.timestamp > 0);
      assertEquals(adminUser.props.btime.uid, ADMIN_UID);
      assert(adminUser.props.ptime.timestamp > 0);
      assertEquals(adminUser.props.ptime.uid, ADMIN_UID);
      assert(adminUser.props.atime.timestamp > 0);
      assertEquals(adminUser.props.atime.uid, ADMIN_UID);
      assertEquals(adminUser.props.mode, 0o570);
      assertEquals(adminUser.attrs.uid, ADMIN_UID);
      assertNotEquals(adminUser.attrs.passwordId, null);

      assertEquals(await utils.exists(remoteNodefs, ADMIN_ACCESS, `/users/${ADMIN_USERNAME}/files`), true);
      assertEquals(await utils.exists(remoteNodefs, ADMIN_ACCESS, `/users/${ADMIN_USERNAME}/groups`), true);
      assertEquals(await utils.exists(remoteNodefs, ADMIN_ACCESS, `/users/${ADMIN_USERNAME}/stars`), true);

      // Verify guest user
      const guestUser = await remoteNodefs.resolveOne<UserAttrs>(ADMIN_ACCESS, `/users/${GUEST_USERNAME}`);
      assertEquals(guestUser.name, GUEST_USERNAME);
      assertEquals(guestUser.paths, [`/users/${GUEST_USERNAME}`]);
      assertEquals(guestUser.type, 'u');
      assert(guestUser.props.btime.timestamp > 0);
      assertEquals(guestUser.props.btime.uid, ADMIN_UID);
      assert(guestUser.props.ptime.timestamp > 0);
      assertEquals(guestUser.props.ptime.uid, ADMIN_UID);
      assert(guestUser.props.atime.timestamp > 0);
      assertEquals(guestUser.props.atime.uid, ADMIN_UID);
      assertEquals(guestUser.props.mode, 0o570);
      assertEquals(guestUser.attrs.uid, GUEST_UID);
      assertEquals(guestUser.attrs.passwordId, null);

      assertEquals(await utils.exists(remoteNodefs, ADMIN_ACCESS, `/users/${GUEST_USERNAME}/files`), true);
      assertEquals(await utils.exists(remoteNodefs, ADMIN_ACCESS, `/users/${GUEST_USERNAME}/groups`), true);
      assertEquals(await utils.exists(remoteNodefs, ADMIN_ACCESS, `/users/${GUEST_USERNAME}/stars`), true);

      // Verify group memberships
      assertEquals(await utils.exists(remoteNodefs, ADMIN_ACCESS, `/users/${ADMIN_USERNAME}/groups/${ADMIN_GROUPNAME}`), true);
      assertEquals(await utils.exists(remoteNodefs, ADMIN_ACCESS, `/groups/${ADMIN_GROUPNAME}/users/${ADMIN_USERNAME}`), true);

      assertEquals(await utils.exists(remoteNodefs, ADMIN_ACCESS, `/users/${GUEST_USERNAME}/groups/${GUEST_GROUPNAME}`), true);
      assertEquals(await utils.exists(remoteNodefs, ADMIN_ACCESS, `/groups/${GUEST_GROUPNAME}/users/${GUEST_USERNAME}`), true);
    });

    await t.step('create a new user', async () => {
      const userNode = await user.makeUser(remoteApi, {
        access: ADMIN_ACCESS,
        name: 'testuser',
        title: 'Test User',
        description: 'Test user',
        passwordId: 'passwordid',
      });

      assertEquals(userNode.name, 'testuser');
      assertEquals(userNode.paths, ['/users/testuser']);
      assertEquals(userNode.type, 'u');
      assert(userNode.props.btime.timestamp > 0);
      assertEquals(userNode.props.btime.uid, ADMIN_UID);
      assert(userNode.props.ptime.timestamp > 0);
      assertEquals(userNode.props.ptime.uid, ADMIN_UID);
      assert(userNode.props.atime.timestamp > 0);
      assertEquals(userNode.props.atime.uid, ADMIN_UID);
      assertEquals(userNode.props.mode, 0o570);
      assert(userNode.attrs.uid > 0);
      assertEquals(userNode.attrs.title, 'Test User');
      assertEquals(userNode.attrs.description, 'Test user');
      assertEquals(userNode.attrs.passwordId, 'passwordid');

      assertEquals(await utils.exists(remoteNodefs, ADMIN_ACCESS, '/users/testuser/files'), true);
      assertEquals(await utils.exists(remoteNodefs, ADMIN_ACCESS, '/users/testuser/groups'), true);
      assertEquals(await utils.exists(remoteNodefs, ADMIN_ACCESS, '/users/testuser/stars'), true);
    });

    await t.step('create a new group', async () => {
      const groupNode = await user.makeGroup(remoteApi, {
        access: ADMIN_ACCESS,
        name: 'testgroup',
        title: 'Test Group',
        description: 'Test group',
      });

      assertEquals(groupNode.name, 'testgroup');
      assertEquals(groupNode.paths, ['/groups/testgroup']);
      assertEquals(groupNode.type, 'g');
      assert(groupNode.props.btime.timestamp > 0);
      assertEquals(groupNode.props.btime.uid, ADMIN_UID);
      assert(groupNode.props.ptime.timestamp > 0);
      assertEquals(groupNode.props.ptime.uid, ADMIN_UID);
      assert(groupNode.props.atime.timestamp > 0);
      assertEquals(groupNode.props.atime.uid, ADMIN_UID);
      assertEquals(groupNode.props.mode, 0o771);
      assert(groupNode.attrs.gid > 0);
      assertEquals(groupNode.attrs.title, 'Test Group');
      assertEquals(groupNode.attrs.description, 'Test group');

      assertEquals(await utils.exists(remoteNodefs, ADMIN_ACCESS, '/groups/testgroup/users'), true);
    });

    await t.step('should join a group and then leave', async () => {
      const userNode = await user.makeUser(remoteApi, {
        access: ADMIN_ACCESS,
        name: crypto.randomUUID(),
      });

      const groupNode = await user.makeGroup(remoteApi, {
        access: ADMIN_ACCESS,
        name: crypto.randomUUID(),
      });

      await user.join(remoteApi, {
        access: ADMIN_ACCESS,
        user: userNode.name,
        group: groupNode.name,
      });

      assertEquals(await utils.exists(remoteNodefs, ADMIN_ACCESS, `/groups/${groupNode.name}/users/${userNode.name}`), true);

      assertEquals(await utils.exists(remoteNodefs, ADMIN_ACCESS, `/users/${userNode.name}/groups/${groupNode.name}`), true);

      await user.leave(remoteApi, {
        access: ADMIN_ACCESS,
        user: userNode.name,
        group: groupNode.name,
      });

      assertEquals(await utils.exists(remoteNodefs, ADMIN_ACCESS, `/groups/${groupNode.name}/users/${userNode.name}`), false);

      assertEquals(await utils.exists(remoteNodefs, ADMIN_ACCESS, `/users/${userNode.name}/groups/${groupNode.name}`), false);
    });

    await t.step('should set a password and then change it', async () => {
      const userNode = await user.makeUser(remoteApi, {
        access: ADMIN_ACCESS,
        name: crypto.randomUUID(),
      });

      await user.setPassword(remoteApi, {
        access: ADMIN_ACCESS,
        name: userNode.name,
        newPassword: 'password123',
      });

      const userNode2 = await remoteNodefs.resolveOne<UserAttrs>(ADMIN_ACCESS, `/users/${userNode.name}`);

      assertEquals(typeof userNode2.attrs.passwordId, 'string');
      assert(userNode2.attrs.passwordId);

      const groups = await remoteNodefs.resolve<GroupAttrs>(ADMIN_ACCESS, `/users/${userNode.name}/groups`);
      const gids = groups.map((group) => group.attrs.gid);

      const userAccess: Access = {
        uid: userNode.attrs.uid,
        gids,
      };

      await user.setPassword(remoteApi, {
        access: userAccess,
        name: userNode.name,
        oldPassword: 'password123',
        newPassword: 'testABC',
      });
    });

    await t.step('should add two stars and then remove one', async () => {
      const userNode = await user.makeUser(remoteApi, {
        access: ADMIN_ACCESS,
        name: crypto.randomUUID(),
      });

      const dir1 = await utils.make(remoteNodefs, ADMIN_ACCESS, `/${crypto.randomUUID()}`, 'd');
      const dir2 = await utils.make(remoteNodefs, ADMIN_ACCESS, `/${crypto.randomUUID()}`, 'd');

      const userAccess: Access = {
        uid: userNode.attrs.uid,
        gids: [],
      };

      await user.toggleStar(remoteApi, {
        access: userAccess,
        path: dir1.paths![0],
      });

      await user.toggleStar(remoteApi, {
        access: userAccess,
        path: dir2.paths![0],
      });

      const stars = await user.getStars(remoteApi, {
        access: userAccess,
      });

      assertEquals(stars.length, 2);
      assertArrayIncludes([stars[0]._id, stars[1]._id], [dir1._id, dir2._id]);

      await user.toggleStar(remoteApi, {
        access: userAccess,
        path: dir1.paths![0],
      });

      const stars2 = await user.getStars(remoteApi, {
        access: userAccess,
      });

      assertEquals(stars2.length, 1);
      assertEquals(stars2[0]._id, dir2._id);
    });

    await t.step('should create session and login then logout', async () => {
      const userNode = await user.makeUser(remoteApi, {
        access: ADMIN_ACCESS,
        name: crypto.randomUUID(),
      });

      await user.join(remoteApi, {
        access: ADMIN_ACCESS,
        user: userNode.name,
        group: USERS_GROUPNAME,
      });

      await user.setPassword(remoteApi, {
        access: ADMIN_ACCESS,
        name: userNode.name,
        newPassword: 'password123',
      });

      const access = await user.ensureSession(remoteApi, {
        access: ADMIN_ACCESS,
      });

      assertEquals(access.admin, undefined);
      assertEquals(access.uid, GUEST_UID);
      assertEquals(access.gids, [GUEST_GID]);
      assertNotEquals(access.sid, undefined);

      const loggedInAccess = await user.login(remoteApi, {
        access,
        username: userNode.name,
        password: 'password123',
      });

      assertEquals(loggedInAccess.admin, undefined);
      assertEquals(loggedInAccess.uid, userNode.attrs.uid);
      assertEquals(loggedInAccess.gids, [USERS_GID]);
      assertEquals(loggedInAccess.sid, access.sid);

      const user2 = await user.whoami(remoteApi, {
        access: loggedInAccess,
      });

      assert(user2.attrs.lastLogin);

      const loggedOutAccess = await user.logout(remoteApi, {
        access: loggedInAccess,
      });

      assertEquals(loggedOutAccess.admin, undefined);
      assertEquals(loggedOutAccess.uid, GUEST_UID);
      assertEquals(loggedOutAccess.gids, [GUEST_GID]);
      assertEquals(loggedOutAccess.sid, access.sid);
    });

    await fullPhy.db.dropDatabase();

    // Teardown

    for (const root of Object.values(config.fs.areas)) {
      await Deno.remove(root, { recursive: true });
    }

    await localApi.destroy();
    await remoteApi.destroy();
    await remoteNodefs.destroy();
    await localNodefs.destroy();
    await lightPhy.destroy();
    await fullPhy.destroy();
    await common.destroy();
  },
  sanitizeOps: false, // TODO: Investigate why this is needed
  sanitizeResources: false, // TODO: Investigate why this is needed
});

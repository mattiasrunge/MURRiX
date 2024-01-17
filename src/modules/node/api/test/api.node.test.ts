import { assert, assertEquals, assertRejects } from 'std/testing/asserts.ts';
import { AccessLevel, ADMIN_ACCESS, ADMIN_UID, DEFAULT_UMASK, NamedNodeData, utils } from '~/blocks/nodefs/mod.ts';
import { GroupId, UserId } from '~/lib/mode/mod.ts';
import { API } from '~/blocks/api/mod.ts';
import { Service } from '~/lib/service/service.ts';
import { AppNodeFS } from '~/app/nodefs/app-nodefs.ts';
import { AppVault } from '~/app/vault/app-vault.ts';
import { AppApi } from '~/app/api/app-api.ts';
import { node } from '../../mod.ts';
import { setOwner } from '../set-owner.ts';
import { setMode } from '../set-mode.ts';
import { resolveOne } from '../resolve-one.ts';
import { access } from '../access.ts';
import { grant } from '../grant.ts';
import { revoke } from '../revoke.ts';

const assertAccess = async (api: API, node: NamedNodeData, uid: UserId, gids: GroupId[], levels: AccessLevel[], expect: boolean) => {
  for (const level of levels) {
    assertEquals(
      await access(api, {
        access: { uid, gids },
        path: node.paths![0],
        level,
      }),
      expect,
      `access(${level}) should ${expect ? '' : 'not '}be allowed for uid=${uid} gids=${gids.join(',')} mode=${node.props.mode}`,
    );
  }
};

Deno.test({
  name: 'api.node',
  fn: async (t) => {
    const config = {
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

    const appNodeFS = await AppNodeFS.create(await Service.create('api.node.test.nodefs'), config);
    const appVault = await AppVault.create(await Service.create('api.node.test.vault'), config);
    const appApi = await AppApi.create(await Service.create('api.node.test.api'), config);

    // Test steps

    await t.step('should run init and verify root', async () => {
      await node.init(appApi.api, {});

      const root = await appApi.nodefs.resolveOne(ADMIN_ACCESS, '/');
      assertEquals(root.name, '/');
      assertEquals(root.paths, ['/']);
      assertEquals(root.type, 'r');
      assert(root.props.btime.timestamp > 0);
      assertEquals(root.props.btime.uid, ADMIN_UID);
      assert(root.props.ptime.timestamp > 0);
      assertEquals(root.props.ptime.uid, ADMIN_UID);
      assert(root.props.atime.timestamp > 0);
      assertEquals(root.props.atime.uid, ADMIN_UID);
      assertEquals(root.props.mode, DEFAULT_UMASK);
    });

    await t.step('should set permissions on a node', async () => {
      const dir = await utils.make(appApi.nodefs, ADMIN_ACCESS, `/${crypto.randomUUID()}`, 'd');
      const file = await utils.make(appApi.nodefs, ADMIN_ACCESS, `/${dir.name}/${crypto.randomUUID()}`, 'f');

      await setOwner(appApi.api, {
        access: ADMIN_ACCESS,
        path: dir.paths![0],
        uid: 9999,
        gid: 9999,
        recursive: false,
      });
      await setMode(appApi.api, {
        access: ADMIN_ACCESS,
        path: dir.paths![0],
        mode: 0o777,
        recursive: false,
      });

      const dir2 = await resolveOne(appApi.api, {
        access: ADMIN_ACCESS,
        path: dir.paths![0],
      });
      const file2 = await resolveOne(appApi.api, {
        access: ADMIN_ACCESS,
        path: file.paths![0],
      });

      assertEquals(dir2.props.uid, 9999);
      assertEquals(dir2.props.gid, 9999);
      assertEquals(dir2.props.mode, 0o777);
      assertEquals(file2.props.uid, file.props.uid);
      assertEquals(file2.props.gid, file.props.gid);
      assertEquals(file2.props.mode, file.props.mode);

      await setOwner(appApi.api, {
        access: ADMIN_ACCESS,
        path: dir.paths![0],
        uid: 8888,
        gid: 8888,
        recursive: true,
      });
      await setMode(appApi.api, {
        access: ADMIN_ACCESS,
        path: dir.paths![0],
        mode: 0o123,
        recursive: true,
      });

      const dir3 = await resolveOne(appApi.api, {
        access: ADMIN_ACCESS,
        path: dir.paths![0],
      });
      const file3 = await resolveOne(appApi.api, {
        access: ADMIN_ACCESS,
        path: file.paths![0],
      });

      assertEquals(dir3.props.uid, 8888);
      assertEquals(dir3.props.gid, 8888);
      assertEquals(dir3.props.mode, 0o123);
      assertEquals(file3.props.uid, 8888);
      assertEquals(file3.props.gid, 8888);
      assertEquals(file3.props.mode, 0o123);
    });

    await t.step('should set uid and gid separately', async () => {
      const file = await utils.make(appApi.nodefs, ADMIN_ACCESS, `/${crypto.randomUUID()}`, 'f');

      await setOwner(appApi.api, {
        access: ADMIN_ACCESS,
        path: file.paths![0],
        uid: 9999,
      });

      const file2 = await resolveOne(appApi.api, {
        access: ADMIN_ACCESS,
        path: file.paths![0],
      });

      assertEquals(file2.props.uid, 9999);
      assertEquals(file2.props.gid, file.props.gid);

      await setOwner(appApi.api, {
        access: ADMIN_ACCESS,
        path: file.paths![0],
        gid: 8888,
      });

      const file3 = await resolveOne(appApi.api, {
        access: ADMIN_ACCESS,
        path: file.paths![0],
      });

      assertEquals(file3.props.uid, file2.props.uid);
      assertEquals(file3.props.gid, 8888);

      await assertRejects(
        async () => {
          await setOwner(appApi.api, {
            access: ADMIN_ACCESS,
            path: file.paths![0],
          });
        },
        Error,
        'uid or gid must be provided',
      );
    });

    await t.step('should check access on node with different permissions', async () => {
      const file = await utils.make(appApi.nodefs, ADMIN_ACCESS, `/${crypto.randomUUID()}`, 'f');

      await setOwner(appApi.api, {
        access: ADMIN_ACCESS,
        path: file.paths![0],
        uid: 9999,
        gid: 9999,
      });

      // Set user all levels
      await setMode(appApi.api, {
        access: ADMIN_ACCESS,
        path: file.paths![0],
        mode: 0o700,
      });

      // User should have all levels
      await assertAccess(
        appApi.api,
        file,
        9999,
        [],
        ['r', 'w', 'x'],
        true,
      );

      // Group should have no levels
      await assertAccess(
        appApi.api,
        file,
        0,
        [9999],
        ['r', 'w', 'x'],
        false,
      );

      // Others should have no levels
      await assertAccess(
        appApi.api,
        file,
        0,
        [],
        ['r', 'w', 'x'],
        false,
      );

      // Set group all levels
      await setMode(appApi.api, {
        access: ADMIN_ACCESS,
        path: file.paths![0],
        mode: 0o070,
      });

      // User should have no levels
      await assertAccess(
        appApi.api,
        file,
        9999,
        [],
        ['r', 'w', 'x'],
        false,
      );

      // Group should have all levels
      await assertAccess(
        appApi.api,
        file,
        0,
        [9999],
        ['r', 'w', 'x'],
        true,
      );

      // Others should have no levels
      await assertAccess(
        appApi.api,
        file,
        0,
        [],
        ['r', 'w', 'x'],
        false,
      );

      // Set others all levels
      await setMode(appApi.api, {
        access: ADMIN_ACCESS,
        path: file.paths![0],
        mode: 0o007,
      });

      // User should have no levels
      await assertAccess(
        appApi.api,
        file,
        9999,
        [],
        ['r', 'w', 'x'],
        true,
      );

      // Group should have no levels
      await assertAccess(
        appApi.api,
        file,
        0,
        [9999],
        ['r', 'w', 'x'],
        true,
      );

      // Others should have all levels
      await assertAccess(
        appApi.api,
        file,
        0,
        [],
        ['r', 'w', 'x'],
        true,
      );
    });

    await t.step('should grant acl and allow access then revoke and deny', async () => {
      const file = await utils.make(appApi.nodefs, ADMIN_ACCESS, `/${crypto.randomUUID()}`, 'f', {}, { mode: 0 });

      await grant(appApi.api, {
        access: ADMIN_ACCESS,
        path: file.paths![0],
        mode: 0o007,
        uid: 8888,
        gid: 9999,
      });

      // User should have all levels
      await assertAccess(
        appApi.api,
        file,
        8888,
        [],
        ['r', 'w', 'x'],
        true,
      );

      // Group should have all levels
      await assertAccess(
        appApi.api,
        file,
        0,
        [9999],
        ['r', 'w', 'x'],
        true,
      );

      // Others should have no levels
      await assertAccess(
        appApi.api,
        file,
        0,
        [],
        ['r', 'w', 'x'],
        false,
      );

      await revoke(appApi.api, {
        access: ADMIN_ACCESS,
        path: file.paths![0],
        mode: 0o007,
        uid: 8888,
        gid: 9999,
      });

      // User should have no levels
      await assertAccess(
        appApi.api,
        file,
        8888,
        [],
        ['r', 'w', 'x'],
        false,
      );

      // Group should have no levels
      await assertAccess(
        appApi.api,
        file,
        0,
        [9999],
        ['r', 'w', 'x'],
        false,
      );

      // Others should have no levels
      await assertAccess(
        appApi.api,
        file,
        0,
        [],
        ['r', 'w', 'x'],
        false,
      );
    });

    await appNodeFS.db.dropDatabase();
    await appVault.db.dropDatabase();

    // Teardown

    for (const root of Object.values(config.fs.areas)) {
      await Deno.remove(root, { recursive: true });
    }

    await appApi.stop();
    await appVault.stop();
    await appNodeFS.stop();
  },
  sanitizeOps: false, // TODO: Investigate why this is needed
  sanitizeResources: false, // TODO: Investigate why this is needed
});

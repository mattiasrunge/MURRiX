import { assert, assertEquals } from 'std/testing/asserts.ts';
import { Common, Config } from '~/layers/0_common/mod.ts';
import { FullPhysical, LightPhysical } from '~/layers/1_physical/mod.ts';
import { ADMIN_ACCESS, ADMIN_UID, DEFAULT_UMASK, LocalNodeFS, RemoteNodeFS } from '~/layers/2_nodefs/mod.ts';
import { API } from '~/layers/3_api/mod.ts';
import { node } from '../../mod.ts';

Deno.test({
  name: 'api.node',
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
    ]);
    const remoteApi = await API.create(remoteNodefs);

    // Test steps

    await t.step('should run init and verify root', async () => {
      await node.init(remoteApi, {});

      const root = await remoteNodefs.resolveOne(ADMIN_ACCESS, '/');
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

import { assertEquals, assertRejects } from 'std/testing/asserts.ts';
import { Service } from '~/lib/service/service.ts';
import { Vault } from '~/lib/vault/mod.ts';
import { AppVault } from '~/app/vault/app-vault.ts';
import { AppApi } from '~/app/api/app-api.ts';

Deno.test({
  name: 'vault',
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

    const appVault = await AppVault.create(await Service.create('api.node.test.vault'), config);
    const appApi = await AppApi.create(await Service.create('api.node.test.api'), config);

    // Test steps

    const commonVaultTests = async (prefix: string, vault: Vault) => {
      await t.step(`[${prefix}]: should set a password and verify then remove`, async () => {
        const id = await vault.setPassword('password123');

        assertEquals(await vault.verifyPassword(id, 'password123'), true);

        await vault.unsetPassword(id);

        await assertRejects(
          async () => {
            await vault.verifyPassword(id, 'password123');
          },
          Error,
          'invalid id',
        );
      });

      await appVault.db.dropDatabase();
    };

    await commonVaultTests('local', appVault.vault);
    await commonVaultTests('remote', appApi.vault);

    // Teardown

    for (const root of Object.values(config.fs.areas)) {
      await Deno.remove(root, { recursive: true });
    }

    await appApi.stop();
    await appVault.stop();
  },
  sanitizeOps: false, // TODO: Investigate why this is needed
  sanitizeResources: false, // TODO: Investigate why this is needed
});

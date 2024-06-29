import { assertEquals, assertRejects } from '@std/assert';
import { DB, DBConfig } from '~/src/external/db/mod.ts';
import { Password } from '../types.ts';
import { setPassword } from '../methods/set-password.ts';
import { unsetPassword } from '../methods/unset-password.ts';
import { verifyPassword } from '../methods/verify-password.ts';

Deno.test({
  name: 'vault',
  fn: async (t) => {
    const config: DBConfig = {
      db: crypto.randomUUID(),
      servers: [
        {
          host: 'localhost',
          port: 27017,
        },
      ],
    };

    // Bringup

    const db = await DB.create(config);
    const col = db.collection<Password>('passwords');

    // Test steps

    await t.step(`should set a password and verify then remove`, async () => {
      const id = await setPassword(col, 'password123');

      assertEquals(await verifyPassword(col, id, 'password123'), true);

      await unsetPassword(col, id);

      await assertRejects(
        async () => {
          await verifyPassword(col, id, 'password123');
        },
        Error,
        'invalid id',
      );
    });

    // Teardown

    await db.dropDatabase();
    await db.destroy();
  },
  sanitizeOps: false, // TODO: Investigate why this is needed
  sanitizeResources: false, // TODO: Investigate why this is needed
});

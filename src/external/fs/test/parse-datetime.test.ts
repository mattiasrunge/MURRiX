import { join } from '@std/path';
import { assert } from '@std/assert';
import { getDatetime } from '../utils/process/get-datetime.ts';

Deno.test({
  name: 'parse-datetime',
  async fn(t) {
    const values = (await Deno.readTextFile(join(import.meta.dirname!, 'data', 'valid-time.txt'))).split('\n');

    await t.step('should successfully parse exif datetime data', async () => {
      for (const str of values) {
        let result;
        try {
          result = getDatetime(str);
          assert(result instanceof Object, 'Result should be an object');
        } catch (error) {
          console.error(str, result);
          console.error(error);

          throw error;
        }
      }
    });

    await t.step('should throw an error for invalid date strings', async () => {
      const invalidValues = (await Deno.readTextFile(join(import.meta.dirname!, 'data', 'invalid-time.txt'))).split('\n');

      for (const str of invalidValues) {
        let error;
        try {
          getDatetime(str);
        } catch (err) {
          error = err;
        }

        assert(error instanceof Error, `Parsing "${str}" should throw an error`);
      }
    });
  },
});

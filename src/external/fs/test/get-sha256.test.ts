import { assertEquals } from '@std/assert';
import { join } from '@std/path';
import { getSha256 } from '../utils/collect/get-sha256.ts';
import { files } from './media-files.ts';

Deno.test('getSha256', async () => {
  for (const file of files) {
    const filename = join(import.meta.dirname!, 'data', file.filename);
    const actualHash = await getSha256(filename);
    assertEquals(actualHash, file.hash);
  }
});

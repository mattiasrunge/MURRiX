import { join } from '@std/path';
import { assertEquals } from '@std/assert';
import { getMimetypeFromFile } from '../utils/collect/get-mimetype-from-file.ts';
import { files } from './media-files.ts';

Deno.test('getMimetypeFromFile', async () => {
  for (const file of files) {
    const filename = join(import.meta.dirname!, 'data', file.filename);
    assertEquals(await getMimetypeFromFile(filename), file.mimetype);
  }
});

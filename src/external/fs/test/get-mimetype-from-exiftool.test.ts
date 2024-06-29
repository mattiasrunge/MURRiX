import { join } from '@std/path';
import { assertEquals } from '@std/assert';
import { getMimetypeFromExiftool } from '../utils/collect/get-mimetype-from-exiftool.ts';
import { files } from './media-files.ts';

Deno.test('getMimetypeFromExiftool', async () => {
  for (const file of files) {
    const filename = join(import.meta.dirname!, 'data', file.filename);
    assertEquals(await getMimetypeFromExiftool(filename), file.mimetype);
  }
});

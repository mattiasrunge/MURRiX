import { assertEquals } from '@std/assert';
import { join } from '@std/path';
import { getRawMetadata } from '../utils/collect/get-raw-metadata.ts';
import { files } from './media-files.ts';

Deno.test('getRawMetadata', async () => {
  for (const file of files) {
    const filename = join(import.meta.dirname!, 'data', file.filename);
    assertEquals(await getRawMetadata(filename), file.metadata.raw);
  }
});

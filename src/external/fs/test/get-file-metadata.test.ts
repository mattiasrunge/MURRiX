import { assertEquals } from '@std/assert';
import { join } from '@std/path';
import { getFileMetadata } from '~/src/external/fs/utils/get-file-metadata.ts';
import { files } from './media-files.ts';

Deno.test('getFileMetadata', async () => {
  for (const file of files) {
    const filename = join(import.meta.dirname!, 'data', file.filename);
    assertEquals(await getFileMetadata(file.mimetype, filename), file.metadata);
  }
});

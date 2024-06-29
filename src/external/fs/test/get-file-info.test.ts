import { assertEquals } from '@std/assert';
import { getFileInfo } from '../utils/process/get-file-info.ts';
import { files } from './media-files.ts';

Deno.test('getFileInfo', async () => {
  for (const file of files) {
    assertEquals(await getFileInfo(file.metadata.raw), file.metadata.file);
  }
});

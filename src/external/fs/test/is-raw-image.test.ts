import { assertEquals } from '@std/assert';
import { isRawImage } from '../utils/process/is-raw-image.ts';

Deno.test({
  name: 'isRawImage',
  async fn(t) {
    await t.step('should return true for known raw image formats', async () => {
      const rawImageFormats = [
        'image/x-canon-cr2',
        'image/x-raw',
        'image/x-canon-crw',
        'image/x-nikon-nef',
        'image/CR2',
        'image/x-panasonic-rw2',
        'image/x-fujifilm-raf',
        'image/x-sony-arw',
        'image/x-adobe-dng',
        'image/x-pentax-pef',
        'image/x-samsung-srw',
        'image/x-olympus-orf',
        'image/x-leica-rwl',
        'image/x-sigma-x3f',
        'image/x-epson-erf',
        'image/x-minolta-mrw',
        'image/x-kodak-dcr',
        'image/x-kodak-k25',
        'image/x-kodak-kdc',
      ];

      for (const format of rawImageFormats) {
        assertEquals(isRawImage(format), true);
      }
    });

    await t.step('should return false for non-raw image formats', async () => {
      const nonRawImageFormats = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/tiff',
        'image/webp',
      ];

      for (const format of nonRawImageFormats) {
        assertEquals(isRawImage(format), false);
      }
    });
  },
});

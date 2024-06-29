/**
 * Checks if the given MIME type corresponds to a raw image format.
 *
 * This function considers a variety of raw image formats from different
 * camera manufacturers. It's useful for identifying if a file is a raw
 * image based on its MIME type.
 *
 * @param mimetype - The MIME type of the file to check.
 * @returns `true` if the MIME type is one of the known raw image formats, otherwise `false`.
 */
export const isRawImage = (mimetype: string) => {
  return [
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
  ].includes(mimetype);
};

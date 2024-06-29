import { FSFileMetaFile, FSFileMetaLayout } from '../../types.ts';
import { JSONValue } from '~/src/shared/types.ts';

/**
 * Retrieves the layout information for a given file.
 *
 * @param raw - The raw metadata of the file.
 * @param file - The file metadata.
 * @returns The layout information of the file.
 */
export const getLayout = (raw: Record<string, JSONValue>, file: FSFileMetaFile) => {
  const layout: FSFileMetaLayout = {
    width: file.width,
    height: file.height,
  };

  // A workaround for images which are already rotated but have not updated the exif data
  // images are landscape mode by default, if the image is not we ignore the orientation
  if (layout.height! < layout.width!) {
    if (raw.Orientation === 8) { // 270 CW (90 CCW)
      layout.angle = 90;
    } else if (raw.Orientation === 6) { // 90 CW (270 CCW)
      layout.angle = 270;
    } else if (raw.Orientation === 3) { // 180 CW (180 CCW)
      layout.angle = 180;
    }
  }

  return layout;
};

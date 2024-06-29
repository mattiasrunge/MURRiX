import { JSONValue } from '~/src/shared/types.ts';
import { FSFileMetaFile } from '../../types.ts';

/**
 * Retrieves file information from a raw object.
 *
 * @param raw - The raw object containing file information.
 * @returns The file information extracted from the raw object.
 */
export const getFileInfo = (raw: Record<string, JSONValue>): FSFileMetaFile => {
  return {
    number: raw.FileNumber ? `${raw.FileNumber}` : undefined,
    width: (raw.ImageWidth) as number | undefined,
    height: (raw.ImageHeight) as number | undefined,
    fps: (raw.FrameRate || raw.VideoFrameRate) as number | undefined,
    iso: (raw.ISO) as number | undefined,
    exposure: (raw.ExposureTime) as number | undefined,
    frames: (raw.FrameCount || raw.LtcChangeTableLtcChangeFrameCount) as number | undefined,
    duration: (raw.Duration) as number | undefined,
  };
};

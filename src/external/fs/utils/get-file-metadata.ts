import { log } from '~/src/shared/log/mod.ts';
import { FSFileMeta } from '../types.ts';
import { getRawMetadata } from './collect/get-raw-metadata.ts';
import { getDatetime } from './process/get-datetime.ts';
import { isRawImage } from './process/is-raw-image.ts';
import { getType } from './process/get-type.ts';
import { getDeviceInfo } from './process/get-device-info.ts';
import { getFileInfo } from './process/get-file-info.ts';
import { getLayout } from './process/get-layout.ts';

/**
 * Retrieves metadata for a file.
 *
 * @param mimetype - The MIME type of the file.
 * @param filename - The name of the file.
 * @returns The file metadata.
 */
export const getFileMetadata = async (mimetype: string, filename: string) => {
  const raw = await getRawMetadata(filename);
  const data: FSFileMeta = {
    raw,
    type: getType(mimetype),
    device: getDeviceInfo(raw),
    file: getFileInfo(raw),
    isRaw: isRawImage(mimetype),
    location: {},
    datetime: {},
    layout: {},
  };

  if (data.type === 'image' || data.type === 'video') {
    data.layout = getLayout(raw, data.file);

    if (data.device.make === 'Apple' && data.type === 'video') {
      if (raw.GPSLongitude && raw.GPSLatitude) {
        data.location = {
          longitude: raw.GPSLongitude as string,
          latitude: raw.GPSLatitude as string,
          altitude: raw.GPSAltitude as string,
        };
      }

      if (raw.CreationDate) {
        data.datetime.device = getDatetime(raw.CreationDate as string);
      }
    } else {
      // GPSDOP == 0 is an indication of errornous data, probably just reused from earlier
      const validGPSLocation = raw.GPSLongitude && raw.GPSLatitude && raw.GPSDOP !== 0;

      if (validGPSLocation) {
        data.location = {
          longitude: raw.GPSLongitude as string,
          latitude: raw.GPSLatitude as string,
          altitude: raw.GPSAltitude as string,
          country: raw.Country as string,
          state: raw.State as string,
          city: raw.City as string,
          landmark: raw.Landmark === '---' ? '' : raw.Landmark as string,
          area: raw.GPSAreaInformation as string,
        };
      }

      const validGPSDateTime = raw.GPSDateTime &&
        raw.GPSDateTime !== '0000:00:00 00:00:00Z' &&
        raw.GPSDOP !== 0 &&
        raw.GPSDateTime !== '1970:01:01 00:00:00Z';

      if (validGPSDateTime) {
        try {
          data.datetime.gps = getDatetime(raw.GPSDateTime as string);
        } catch (error) {
          log.error(`Failed to parse exit 'GPSDateTime' with value ${raw.GPSDateTime}`, error);
        }
      }

      if (raw.DateTimeOriginal) {
        data.datetime.device = getDatetime(raw.DateTimeOriginal as string);
      } else if (raw.CreationDateValue) {
        data.datetime.device = getDatetime(raw.CreationDateValue as string);
      } else if (raw.CreateDate) {
        data.datetime.device = getDatetime(raw.CreateDate as string);
      }
    }
  } else if (data.type === 'application') {
    if (raw['Creation-date']) {
      data.datetime.device = getDatetime(raw['Creation-date'] as string);
    } else if (raw.Date) {
      data.datetime.device = getDatetime(raw.Date as string);
    }
  }

  return data;
};

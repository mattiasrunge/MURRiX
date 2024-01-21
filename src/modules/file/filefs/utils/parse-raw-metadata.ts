// deno-lint-ignore-file no-control-regex

import { JSONValue } from '~/src/shared/types.ts';
import { log } from '~/src/shared/log/mod.ts';
import { FileMeta, FileMetaDataTime, FileMetaDevice, FileMetaFile } from '../types.ts';

const getDeviceInfo = (meta: Record<string, JSONValue>): FileMetaDevice => {
  let serialNumber: string | undefined;

  if (meta.SerialNumber) {
    serialNumber = meta.SerialNumber.toString().replace(/\u0000/g, '');
  } else if (meta.InternalSerialNumber) {
    serialNumber = meta.InternalSerialNumber.toString().replace(/\u0000/g, '');
  } else if (meta.DeviceSerialNo) {
    serialNumber = meta.DeviceSerialNo.toString();
  }

  return {
    serialNumber,
    model: (meta.Model || meta.DeviceModelName) as string | undefined,
    make: (meta.Make || meta.DeviceManufacturer) as string | undefined,
  };
};

const getFileInfo = (meta: Record<string, JSONValue>): FileMetaFile => {
  return {
    number: (meta.FileNumber) as string | undefined,
    width: (meta.ImageWidth) as number | undefined,
    height: (meta.ImageHeight) as number | undefined,
    fps: (meta.FrameRate || meta.VideoFrameRate) as number | undefined,
    iso: (meta.ISO) as number | undefined,
    exposure: (meta.ExposureTime) as number | undefined,
    frames: (meta.FrameCount || meta.LtcChangeTableLtcChangeFrameCount) as number | undefined,
    duration: (meta.Duration) as number | undefined,
  };
};

const getType = (mimetype: string) => {
  return mimetype.split('/')[0];
};

const parseDataTime = (dateStr: string): FileMetaDataTime => {
  let timezone: string | undefined;

  const matches = dateStr.match(/([0-9 ]{4})[:/]([0-9 ]{2})[:/]([0-9 ]{2}) ([0-9 ]{2}):([0-9 ]{2}):?([0-9 ]{2})?(?:\.[0-9]+)?([\+|\-|Z].*)?/);

  if (!matches) {
    throw new Error(`Failed to parse exif data "${dateStr}"`);
  }

  const parts = matches.map((v) => v ? (v.trim() || undefined) : undefined);

  if (parts[7] === 'Z') {
    timezone = '+00:00';
    dateStr = dateStr.substr(0, dateStr.length - 1); // Remove trailing Z
  } else if (parts[7]) {
    timezone = parts[7];
  }

  return {
    year: parts[1],
    month: parts[2],
    day: parts[3],
    hour: parts[4],
    minute: parts[5],
    second: parts[6],
    timezone: timezone || false,
  };
};

const isRawImage = (mimetype: string) => {
  return [
    'image/x-canon-cr2',
    'image/x-raw',
    'image/x-canon-crw',
    'image/x-nikon-nef',
    'image/CR2',
    'image/x-panasonic-rw2',
    'image/x-fujifilm-raf',
  ].includes(mimetype);
};

export const parseRawMetadata = (mimetype: string, meta: Record<string, JSONValue>) => {
  const data: FileMeta = {
    type: getType(mimetype),
    device: getDeviceInfo(meta),
    file: getFileInfo(meta),
    isRaw: isRawImage(mimetype),
    location: {},
    datetime: {},
    layout: {},
  };

  if (data.type === 'image' || data.type === 'video') {
    data.layout.width = data.file.width!;
    data.layout.height = data.file.height!;

    if (data.device.make === 'Apple' && data.type === 'video') {
      if (meta.GPSLongitude && meta.GPSLatitude) {
        data.location = {
          longitude: meta.GPSLongitude as string,
          latitude: meta.GPSLatitude as string,
          altitude: meta.GPSAltitude as string,
        };
      }

      if (meta.CreationDate) {
        data.datetime.device = parseDataTime(meta.CreationDate as string);
      }
    } else {
      // A workaround for images which are already rotated but have not updated the exif data
      // images are landscape mode by default, if the image is not we ignore the orientation
      if (data.layout.height < data.layout.width) {
        if (meta.Orientation === 8) { // 270 CW (90 CCW)
          data.layout.angle = 90;
        } else if (meta.Orientation === 6) { // 90 CW (270 CCW)
          data.layout.angle = 270;
        } else if (meta.Orientation === 3) { // 180 CW (180 CCW)
          data.layout.angle = 180;
        }
      }

      // GPSDOP == 0 is an indication of errornous data, probably just reused from earlier

      if (meta.GPSLongitude && meta.GPSLatitude && meta.GPSDOP !== 0) {
        data.location = {
          longitude: meta.GPSLongitude as string,
          latitude: meta.GPSLatitude as string,
          altitude: meta.GPSAltitude as string,
          country: meta.Country as string,
          state: meta.State as string,
          city: meta.City as string,
          landmark: meta.Landmark === '---' ? '' : meta.Landmark as string,
          area: meta.GPSAreaInformation as string,
        };
      }

      if (
        meta.GPSDateTime &&
        meta.GPSDateTime !== '0000:00:00 00:00:00Z' &&
        meta.GPSDOP !== 0 &&
        meta.GPSDateTime !== '1970:01:01 00:00:00Z'
      ) {
        try {
          data.datetime.gps = parseDataTime(meta.GPSDateTime as string);
        } catch (error) {
          log.error(`Failed to parse exit 'GPSDateTime' with value ${meta.GPSDateTime}`, error);
        }
      }

      if (meta.DateTimeOriginal) {
        data.datetime.device = parseDataTime(meta.DateTimeOriginal as string);
      } else if (meta.CreationDateValue) {
        data.datetime.device = parseDataTime(meta.CreationDateValue as string);
      } else if (meta.CreateDate) {
        data.datetime.device = parseDataTime(meta.CreateDate as string);
      }
    }
  }

  return data;
};

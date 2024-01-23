// deno-lint-ignore-file no-control-regex

import { JSONValue } from '~/src/shared/types.ts';
import { log } from '~/src/shared/log/mod.ts';
import { FSFileMeta, FSFileMetaDataTime, FSFileMetaDevice, FSFileMetaFile } from '../types.ts';
import { getRawMetadata } from './get-raw-metadata.ts';

const getDeviceInfo = (raw: Record<string, JSONValue>): FSFileMetaDevice => {
  let serialNumber: string | undefined;

  if (raw.SerialNumber) {
    serialNumber = raw.SerialNumber.toString().replace(/\u0000/g, '');
  } else if (raw.InternalSerialNumber) {
    serialNumber = raw.InternalSerialNumber.toString().replace(/\u0000/g, '');
  } else if (raw.DeviceSerialNo) {
    serialNumber = raw.DeviceSerialNo.toString();
  }

  return {
    serialNumber,
    model: (raw.Model || raw.DeviceModelName) as string | undefined,
    make: (raw.Make || raw.DeviceManufacturer) as string | undefined,
  };
};

const getFileInfo = (raw: Record<string, JSONValue>): FSFileMetaFile => {
  return {
    number: (raw.FileNumber) as string | undefined,
    width: (raw.ImageWidth) as number | undefined,
    height: (raw.ImageHeight) as number | undefined,
    fps: (raw.FrameRate || raw.VideoFrameRate) as number | undefined,
    iso: (raw.ISO) as number | undefined,
    exposure: (raw.ExposureTime) as number | undefined,
    frames: (raw.FrameCount || raw.LtcChangeTableLtcChangeFrameCount) as number | undefined,
    duration: (raw.Duration) as number | undefined,
  };
};

const getType = (mimetype: string) => {
  return mimetype.split('/')[0];
};

const parseDataTime = (dateStr: string): FSFileMetaDataTime => {
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
    data.layout.width = data.file.width!;
    data.layout.height = data.file.height!;

    if (data.device.make === 'Apple' && data.type === 'video') {
      if (raw.GPSLongitude && raw.GPSLatitude) {
        data.location = {
          longitude: raw.GPSLongitude as string,
          latitude: raw.GPSLatitude as string,
          altitude: raw.GPSAltitude as string,
        };
      }

      if (raw.CreationDate) {
        data.datetime.device = parseDataTime(raw.CreationDate as string);
      }
    } else {
      // A workaround for images which are already rotated but have not updated the exif data
      // images are landscape mode by default, if the image is not we ignore the orientation
      if (data.layout.height < data.layout.width) {
        if (raw.Orientation === 8) { // 270 CW (90 CCW)
          data.layout.angle = 90;
        } else if (raw.Orientation === 6) { // 90 CW (270 CCW)
          data.layout.angle = 270;
        } else if (raw.Orientation === 3) { // 180 CW (180 CCW)
          data.layout.angle = 180;
        }
      }

      // GPSDOP == 0 is an indication of errornous data, probably just reused from earlier

      if (raw.GPSLongitude && raw.GPSLatitude && raw.GPSDOP !== 0) {
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

      if (
        raw.GPSDateTime &&
        raw.GPSDateTime !== '0000:00:00 00:00:00Z' &&
        raw.GPSDOP !== 0 &&
        raw.GPSDateTime !== '1970:01:01 00:00:00Z'
      ) {
        try {
          data.datetime.gps = parseDataTime(raw.GPSDateTime as string);
        } catch (error) {
          log.error(`Failed to parse exit 'GPSDateTime' with value ${raw.GPSDateTime}`, error);
        }
      }

      if (raw.DateTimeOriginal) {
        data.datetime.device = parseDataTime(raw.DateTimeOriginal as string);
      } else if (raw.CreationDateValue) {
        data.datetime.device = parseDataTime(raw.CreationDateValue as string);
      } else if (raw.CreateDate) {
        data.datetime.device = parseDataTime(raw.CreateDate as string);
      }
    }
  }

  return data;
};

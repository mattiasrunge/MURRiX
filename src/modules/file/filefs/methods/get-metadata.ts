import { FS } from '~/src/external/fs/mod.ts';
import { getMetadataRaw } from './get-metadata-raw.ts';

export const getMetadata = async (fs: FS, id: string, area: string) => {
  const raw = getMetadataRaw(fs, id, area);

  const data = {
    raw: exif,
    name: exif.FileName,
    type: file.getType(exif.MIMEType),
    mimetype: exif.MIMEType,
    size: await file.getFileSize(filename),
    deviceinfo: {
      model: exif.Model || exif.DeviceModelName,
      make: exif.Make || exif.DeviceManufacturer,
    },
    fileinfo: {
      number: exif.FileNumber,
      width: exif.ImageWidth,
      height: exif.ImageHeight,
      fps: exif.FrameRate || exif.VideoFrameRate,
      iso: exif.ISO,
      exposure: exif.ExposureTime,
      frames: exif.FrameCount || exif.LtcChangeTableLtcChangeFrameCount,
      duration: exif.Duration,
    },
  };

  if (!options.noChecksums) {
    data.sha1 = await file.checksumFile(filename, 'sha1');
    data.md5 = await file.checksumFile(filename, 'md5');
  }

  if (exif.SerialNumber) {
    data.deviceSerialNumber = exif.SerialNumber.toString().replace(/\u0000/g, '');
  } else if (exif.InternalSerialNumber) {
    data.deviceSerialNumber = exif.InternalSerialNumber.toString().replace(/\u0000/g, '');
  } else if (exif.DeviceSerialNo) {
    data.deviceSerialNumber = exif.DeviceSerialNo.toString();
  }

  if (data.type === 'image' || data.type === 'video') {
    data.width = exif.ImageWidth;
    data.height = exif.ImageHeight;
    data.where = {};
    data.when = {};

    // TODO: Can we remove this, it causes issues and should be a display issue that looks at the set angle not the exif data
    // if (exif.Rotation === 90 || exif.Rotation === 270) {
    //     data.fileinfo.width = data.width = exif.ImageHeight;
    //     data.fileinfo.height = data.height = exif.ImageWidth;
    // }

    if (data.deviceinfo.make === 'Apple' && data.type === 'video') {
      if (exif.GPSLongitude && exif.GPSLatitude) {
        data.where.gps = {
          longitude: exif.GPSLongitude,
          latitude: exif.GPSLatitude,
          altitude: exif.GPSAltitude,
        };
      }

      if (exif.CreationDate) {
        data.when.device = utils.parseExifDate(exif.CreationDate);
        data.when.device.deviceType = 'unknown';
        data.when.device.deviceAutoDst = false;
        data.when.device.deviceUtcOffset = 0;
      }
    } else {
      // A workaround for images which are already rotated but have not updated the exif data
      // images are landscape mode by default, if the image is not we ignore the orientation
      if (exif.ImageHeight < exif.ImageWidth) {
        if (exif.Orientation === 8) { // 270 CW (90 CCW)
          data.angle = 90;
        } else if (exif.Orientation === 6) { // 90 CW (270 CCW)
          data.angle = 270;
        } else if (exif.Orientation === 3) { // 180 CW (180 CCW)
          data.angle = 180;
        }
      }

      if (data.type === 'image') {
        data.rawImage = file.isRawimage(data.mimetype);
      }

      // GPSDOP == 0 is an indication of errornous data, probably just reused from earlier

      if (exif.GPSLongitude && exif.GPSLatitude && exif.GPSDOP !== 0) {
        data.where.gps = {
          longitude: exif.GPSLongitude,
          latitude: exif.GPSLatitude,
          altitude: exif.GPSAltitude,
          country: exif.Country,
          state: exif.State,
          city: exif.City,
          landmark: exif.Landmark === '---' ? '' : exif.Landmark,
          area: exif.GPSAreaInformation,
        };
      }

      if (exif.GPSDateTime && exif.GPSDateTime !== '0000:00:00 00:00:00Z' && exif.GPSDOP !== 0 && exif.GPSDateTime !== '1970:01:01 00:00:00Z') {
        try {
          data.when.gps = utils.parseExifDate(exif.GPSDateTime);
        } catch (error) {
          log.error(`Failed to parse exit 'GPSDateTime' with value ${exif.GPSDateTime}`, error);
        }
      }

      if (exif.DateTimeOriginal) {
        data.when.device = utils.parseExifDate(exif.DateTimeOriginal);
        data.when.device.deviceType = 'unknown';
        data.when.device.deviceAutoDst = false;
        data.when.device.deviceUtcOffset = 0;
      } else if (exif.CreationDateValue) {
        data.when.device = utils.parseExifDate(exif.CreationDateValue);
        data.when.device.deviceType = 'unknown';
        data.when.device.deviceAutoDst = false;
        data.when.device.deviceUtcOffset = 0;
      } else if (exif.CreateDate) {
        data.when.device = utils.parseExifDate(exif.CreateDate);
        data.when.device.deviceType = 'unknown';
        data.when.device.deviceAutoDst = false;
        data.when.device.deviceUtcOffset = 0;
      }
    }
  }

  return data;
};

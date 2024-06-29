// deno-lint-ignore-file no-control-regex
import { JSONValue } from '~/src/shared/types.ts';
import { FSFileMetaDevice } from '../../types.ts';

/**
 * Retrieves device information from the provided raw data.
 *
 * @param raw - The raw data containing device information.
 * @returns The device information extracted from the raw data.
 */
export const getDeviceInfo = (raw: Record<string, JSONValue>): FSFileMetaDevice => {
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

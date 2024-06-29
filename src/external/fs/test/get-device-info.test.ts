import { assertEquals } from '@std/assert';
import { getDeviceInfo } from '../utils/process/get-device-info.ts';

Deno.test('getDeviceInfo', () => {
  const testData = [
    {
      raw: {
        SerialNumber: 'ABC123',
        Model: 'Model 1',
        Make: 'Manufacturer 1',
      },
      expected: {
        serialNumber: 'ABC123',
        model: 'Model 1',
        make: 'Manufacturer 1',
      },
    },
    {
      raw: {
        InternalSerialNumber: 'DEF456',
        DeviceModelName: 'Model 2',
        DeviceManufacturer: 'Manufacturer 2',
      },
      expected: {
        serialNumber: 'DEF456',
        model: 'Model 2',
        make: 'Manufacturer 2',
      },
    },
    {
      raw: {
        DeviceSerialNo: 'GHI789',
        Make: 'Manufacturer 3',
      },
      expected: {
        serialNumber: 'GHI789',
        model: undefined,
        make: 'Manufacturer 3',
      },
    },
    {
      raw: {},
      expected: {
        serialNumber: undefined,
        model: undefined,
        make: undefined,
      },
    },
  ];

  testData.forEach(({ raw, expected }) => {
    assertEquals(getDeviceInfo(raw), expected);
  });
});

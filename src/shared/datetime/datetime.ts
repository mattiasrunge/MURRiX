import { assert } from '@std/assert';
import { DatetimeAccuracy, DatetimeObject, DatetimeOut, DatetimeParams, DatetimeQuality, DatetimeSource, DatetimeSources, DatetimeSpec } from './types.ts';
import { default as moment } from 'moment-timezone';

/* Definitions:
 * - str : Time specified in string format
 * - time : Time specified in object format
 * - timestamp : Best timestamp from list of sources (time objects)
 * - sources : Object with one or more of the gps, device and manual keys with time objects
 */

const splitAt = (str: string, index: number) => {
  return [str.slice(0, index), str.slice(index)];
};

const isNumber = (n: any) => {
  const f = Number.parseFloat(n);
  return !Number.isNaN(f) && Number.isFinite(f);
};

const validate = (input: string | string[], type: keyof DatetimeObject) => {
  let data: string | string[] = input;
  const max = {
    year: '9999',
    month: '12',
    day: '31',
    hour: '23',
    minute: '59',
    second: '59',
    timezone: '59',
  };
  const min = {
    year: '0000',
    month: '01',
    day: '00',
    hour: '00',
    minute: '00',
    second: '00',
    timezone: '00',
  };

  if (type === 'timezone') {
    assert(data.length === 6, type + ' must be 6 letters and digits');
    const hours = (data as string).substring(1, 3);
    const separator = (data as string).substring(3, 4);
    const minutes = (data as string).substring(4, 6);

    assert(hours.length === 2, type + ' must be 2 digits');
    assert(isNumber(hours), type + ' hours must be a number');
    assert(separator === ':', type + ' separator must be a :');
    assert(isNumber(minutes), type + ' minutes must be a number');
    assert(Number.parseInt(hours, 10) >= Number.parseInt(min[type], 10), type + ' hours must be larger or equal to ' + min[type]);
    assert(Number.parseInt(minutes, 10) <= Number.parseInt(max[type], 10), type + ' minutes must be smallar or equal to ' + max[type]);

    return data;
  }

  if (typeof input === 'string') {
    data = [input];
  }

  const len = type === 'year' ? 4 : 2;

  assert(data[0].length === len, type + ' must be ' + len + ' digits');
  assert(isNumber(data[0]), type + ' must be a number');
  assert(Number.parseInt(data[0], 10) >= Number.parseInt(min[type], 10), type + ' must be larger or equal to ' + min[type]);
  assert(Number.parseInt(data[0], 10) <= Number.parseInt(max[type], 10), type + ' must be smallar or equal to ' + max[type]);

  if (data.length > 1) {
    assert(data[1].length === len, type + ' must be ' + len + ' digits');
    assert(isNumber(data[1]), type + ' must be a number');
    assert(Number.parseInt(data[0], 10) < Number.parseInt(data[1], 10), type + ' range can not be negative');
    assert(Number.parseInt(data[1], 10) >= Number.parseInt(min[type], 10), type + ' must be larger or equal to ' + min[type]);
    assert(Number.parseInt(data[1], 10) <= Number.parseInt(max[type], 10), type + ' must be smallar or equal to ' + max[type]);
  }

  return input;
};

const getUtcOffsetFromDatetimeSpec = (spec: DatetimeSpec): number => {
  if (!spec.timezone) {
    return 0;
  }

  const { year = 0, month = 0, day = 1, hour = 0, minute = 0, second = 0 } = spec;
  const date = new Date(Date.UTC(year, month, day, hour, minute, second));

  // Extract the offset from the time.timezone string
  const [hours, minutes] = spec.timezone.split(':').map(Number);
  const offsetInMinutes = (hours * 60 + minutes) * -1;

  // Apply the offset to the date
  date.setUTCMinutes(date.getUTCMinutes() - offsetInMinutes);

  // Get the final UTC offset in minutes
  return date.getTimezoneOffset();
};

const isDST = (spec: DatetimeSpec, debug?: boolean): boolean => {
  const { year = 0, month = 0, day = 1, hour = 0, minute = 0, second = 0 } = spec;
  const date = new Date(year, month, day, hour, minute, second);
  const januaryOffset = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
  const julyOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
  const result = Math.min(januaryOffset, julyOffset) !== date.getTimezoneOffset();
  if (debug) {
    console.log('date', date);
    console.log('januaryOffset', januaryOffset);
    console.log('julyOffset', julyOffset);
    console.log(' date.getTimezoneOffset();', date.getTimezoneOffset());
    console.log('result', result);
    console.log('getUtcOffsetFromDatetimeSpec', getUtcOffsetFromDatetimeSpec(spec));
  }

  return result;
};

const parsetime = (time: DatetimeObject, timeIsDstAdjusted: boolean): DatetimeOut => {
  let timestamp: number | boolean = false;
  let quality: DatetimeQuality | false = false;
  let accuracy: DatetimeAccuracy | false = false;

  if (time) {
    let utcOffset = 0;
    let dstOffset = 0;
    let foundRange = false;
    const spec: DatetimeSpec = {};
    quality = 'fuzzy';

    if (time.year) {
      foundRange = Array.isArray(time.year);
      spec.year = Number.parseInt(Array.isArray(time.year) ? time.year[0] : time.year, 10);
      accuracy = 'year';
    }

    if (time.month && !foundRange) {
      foundRange = Array.isArray(time.month);
      spec.month = Number.parseInt(Array.isArray(time.month) ? time.month[0] : time.month, 10) - 1; // Moment expects zero based
      accuracy = 'month';
    }

    if (time.day && !foundRange) {
      foundRange = Array.isArray(time.day);
      spec.day = Number.parseInt(Array.isArray(time.day) ? time.day[0] : time.day, 10);
      accuracy = 'day';
    }

    if (time.hour && !foundRange) {
      foundRange = Array.isArray(time.hour);
      spec.hour = Number.parseInt(Array.isArray(time.hour) ? time.hour[0] : time.hour, 10);
      accuracy = 'hour';
    }

    if (time.minute && !foundRange) {
      foundRange = Array.isArray(time.minute);
      spec.minute = Number.parseInt(Array.isArray(time.minute) ? time.minute[0] : time.minute, 10);
      accuracy = 'minute';
    }

    if (time.second && !foundRange) {
      foundRange = Array.isArray(time.second);
      spec.second = Number.parseInt(Array.isArray(time.second) ? time.second[0] : time.second, 10);
      accuracy = 'second';

      if (!foundRange) {
        quality = 'local';

        if (timeIsDstAdjusted) {
          const newDst = isDST(spec);
          const oldDst = moment(spec).isDST();

          if (newDst !== oldDst) {
            console.log('FAIL', spec, `was ${newDst} should be ${oldDst}`);
          }

          dstOffset = isDST(spec, newDst !== oldDst) ? 3600 : 0;
          dstOffset = moment(spec).isDST() ? 3600 : 0;
        }
      }
    }

    if (time.timezone && !foundRange) {
      utcOffset = moment(spec).utcOffset(time.timezone).utcOffset() * 60;
      quality = 'utc';
    }

    timestamp = moment.utc(spec).unix() - utcOffset - dstOffset;
  }

  return {
    timestamp: timestamp,
    quality: quality,
    accuracy: accuracy,
  };
};

export const str2time = (str: string) => {
  const result: DatetimeObject = {};
  let foundRange = false;

  if (str.length < 4) {
    return false;
  }

  // Year
  const parts = splitAt(str, 4);
  result.year = validate(parts[0], 'year');
  str = parts[1];

  if (str[0] === '|') {
    const parts = splitAt(str.slice(1), 4);
    result.year = validate([result.year as string, parts[0]], 'year');
    str = parts[1];
    foundRange = true;
  }

  if (str.length > 0 && !foundRange) {
    // Month
    if (str[0] === '-') {
      const parts = splitAt(str.slice(1), 2);
      result.month = validate(parts[0], 'month');
      str = parts[1];
    } else {
      throw new Error('Expected a -');
    }

    if (str[0] === '|') {
      const parts = splitAt(str.slice(1), 2);
      result.month = validate([result.month as string, parts[0]], 'month');
      str = parts[1];
      foundRange = true;
    }
  }

  if (str.length > 0 && !foundRange) {
    // Day
    if (str[0] === '-') {
      const parts = splitAt(str.slice(1), 2);
      result.day = validate(parts[0], 'day');
      str = parts[1];
    } else {
      throw new Error('Expected a -');
    }

    if (str[0] === '|') {
      const parts = splitAt(str.slice(1), 2);
      result.day = validate([result.day as string, parts[0]], 'day');
      str = parts[1];
      foundRange = true;
    }
  }

  if (str.length > 0 && !foundRange) {
    // Hour
    if (str[0] === ' ' || str[0] === 'T') {
      const parts = splitAt(str.slice(1), 2);
      result.hour = validate(parts[0], 'hour');
      str = parts[1];
    } else {
      throw new Error('Expected a space or T');
    }

    if (str[0] === '|') {
      const parts = splitAt(str.slice(1), 2);
      result.hour = validate([result.hour as string, parts[0]], 'hour');
      str = parts[1];
      foundRange = true;
    }
  }

  if (str.length > 0 && !foundRange) {
    // Minute
    if (str[0] === ':') {
      const parts = splitAt(str.slice(1), 2);
      result.minute = validate(parts[0], 'minute');
      str = parts[1];
    } else {
      throw new Error('Expected a :');
    }

    if (str[0] === '|') {
      const parts = splitAt(str.slice(1), 2);
      result.minute = validate([result.minute as string, parts[0]], 'minute');
      str = parts[1];
      foundRange = true;
    }
  }

  if (str.length > 0 && !foundRange) {
    // Second
    if (str[0] === ':') {
      const parts = splitAt(str.slice(1), 2);
      result.second = validate(parts[0], 'second');
      str = parts[1];
    } else {
      throw new Error('Expected a :');
    }

    if (str[0] === '|') {
      const parts = splitAt(str.slice(1), 2);
      result.second = validate([result.second as string, parts[0]], 'second');
      str = parts[1];
      foundRange = true;
    }
  }

  if (str.length > 0 && !foundRange) {
    // Second
    if (str[0] === 'Z') {
      result.timezone = '+00:00';
      str = str.slice(1);
    } else if (str[0] === '-' || str[0] === '+') {
      const parts = splitAt(str, 6);
      result.timezone = validate(parts[0], 'timezone') as string;
      str = parts[1];
    } else {
      throw new Error('Expected a - or +');
    }
  }

  if (str.length > 0 && foundRange) {
    throw new Error('Can not add more information after range');
  } else if (str.length > 0 && result.timezone) {
    throw new Error('Can not add more information after timezone');
  }

  return result;
};

export const time2str = (time: DatetimeObject) => {
  let str = '';

  if (Array.isArray(time.year)) {
    str += time.year[0] + '|' + time.year[1];
    return str;
  } else if (time.year) {
    str += time.year;
  } else {
    return str;
  }

  if (Array.isArray(time.month)) {
    str += '-' + time.month[0] + '|' + time.month[1];
    return str;
  } else if (time.month) {
    str += '-' + time.month;
  } else {
    return str;
  }

  if (Array.isArray(time.day)) {
    str += '-' + time.day[0] + '|' + time.day[1];
    return str;
  } else if (time.day) {
    str += '-' + time.day;
  } else {
    return str;
  }

  if (Array.isArray(time.hour)) {
    str += ' ' + time.hour[0] + '|' + time.hour[1];
    return str;
  } else if (time.hour) {
    str += ' ' + time.hour;
  } else {
    return str;
  }

  if (Array.isArray(time.minute)) {
    str += ':' + time.minute[0] + '|' + time.minute[1];
    return str;
  } else if (time.minute) {
    str += ':' + time.minute;
  } else {
    return str;
  }

  if (Array.isArray(time.second)) {
    str += ':' + time.second[0] + '|' + time.second[1];
    return str;
  } else if (time.second) {
    str += ':' + time.second;
  } else {
    return str;
  }

  if (time.timezone) {
    str += time.timezone;
  }

  return str;
};

export const time2timestamp = (time: DatetimeObject, params: DatetimeParams) => {
  let timeIsDstAdjusted = false;

  if (params.type === 'manual') {
    timeIsDstAdjusted = true;
  } else if (params.type === 'gps') {
    timeIsDstAdjusted = false;
  } else if (params.type === 'device') {
    timeIsDstAdjusted = params.deviceAutoDst;
  } else {
    throw new Error('Unknown type ' + params.type);
  }

  const timestamp = parsetime(time, timeIsDstAdjusted);

  if (timestamp.quality !== false && params.type === 'device') {
    if (params.deviceUtcOffset) {
      timestamp.timestamp = (timestamp.timestamp as number) - params.deviceUtcOffset;
      timestamp.quality = 'utc';
    }
  }

  timestamp.type = params.type;

  return timestamp;
};

export const select = (sources: DatetimeSources): DatetimeSource | false => {
  if (sources.manual) {
    return { time: sources.manual, type: 'manual' };
  } else if (sources.gps) {
    return { time: sources.gps, type: 'gps' };
  } else if (sources.device) {
    return { time: sources.device, type: 'device' };
  }

  return false;
};

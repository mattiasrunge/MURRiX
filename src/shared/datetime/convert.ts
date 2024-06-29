import { assert } from '@std/assert';

type DatetimeQuality = 'partial' | 'utc' | 'fuzzy';
type DatetimeAccuracy = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';
type DatetimeType = 'manual' | 'gps' | 'device';

export type DatetimeInput = {
  value: string;
  type: DatetimeType;
  isDSTAdjusted?: boolean;
  dstOffset?: number;
  duration?: number;
};

type DatetimeRange = {
  start: number;
  end: number;
};

export type DatetimeOutput = {
  input: DatetimeInput;
  accuracy: DatetimeAccuracy;
  quality: DatetimeQuality;
  utcTimestamp: number;
  utcRanges: DatetimeRange[];
};

export type DatetimeObject = {
  year: number[];
  month: number[];
  day: number[];
  hour: number[];
  minute: number[];
  second: number[];
  timezone: string;
  accuracy: DatetimeAccuracy;
  quality: DatetimeQuality;
};

type NextOutput = {
  result: number[];
  next: string;
};

export type DatetimeInstantSpec = {
  year: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  accuracy: DatetimeAccuracy;
};

const splitAt = (str: string, index: number) => {
  return [str.slice(0, index), str.slice(index)];
};

const parseNext = (next: string, div: string[], size: 2 | 4) => {
  if (div.length > 0) {
    if (!div.includes(next[0])) {
      throw new Error(`Expected a one of ${div.join(',')} but got ${next[0]}`);
    } else {
      next = next.slice(1);
    }
  }

  const output: NextOutput = {
    result: [],
    next,
  };

  const first = splitAt(next, size);

  output.result.push(Number.parseInt(first[0], 10));
  output.next = first[1];

  if (output.next[0] === '|') {
    const second = splitAt(output.next.slice(1), size);
    const value = Number.parseInt(second[0], 10);
    const previousValue = output.result[output.result.length - 1];

    assert(value > previousValue, `${value} should be larger than ${previousValue} but it is not`);

    output.result.push(value);

    output.next = second[1];
  }

  return output;
};

export const convert = (input: DatetimeInput): DatetimeOutput => {
  if (input.type === 'gps') {
    const instant = Temporal.Instant.from(input.value);
    const utcTimestamp = instant.epochMilliseconds;

    return {
      input,
      accuracy: 'second',
      quality: 'utc',
      utcTimestamp,
      utcRanges: [{ start: utcTimestamp, end: utcTimestamp }],
    };
  }

  const result: DatetimeObject = {
    year: [],
    month: [],
    day: [],
    hour: [],
    minute: [],
    second: [],
    timezone: '',
    accuracy: 'year',
    quality: 'utc',
  };

  assert(input.value.length > 3, 'Value is missing complete year');

  // Year
  let output = parseNext(input.value, [], 4);
  result.year = output.result;
  result.accuracy = 'year';
  result.quality = output.result.length > 1 ? 'fuzzy' : result.quality;

  // Month
  if (output.next.length > 0) {
    output = parseNext(output.next, ['-'], 2);
    result.month = output.result;
    result.accuracy = 'month';
    result.quality = output.result.length > 1 ? 'fuzzy' : result.quality;
  }

  // Day
  if (output.next.length > 0) {
    output = parseNext(output.next, ['-'], 2);
    result.day = output.result;
    result.accuracy = 'day';
    result.quality = output.result.length > 1 ? 'fuzzy' : result.quality;
  }

  // Hour
  if (output.next.length > 0) {
    output = parseNext(output.next, [' ', 'T'], 2);
    result.hour = output.result;
    result.accuracy = 'hour';
    result.quality = output.result.length > 1 ? 'fuzzy' : result.quality;
  }

  // Minute
  if (output.next.length > 0) {
    output = parseNext(output.next, [':'], 2);
    result.minute = output.result;
    result.accuracy = 'minute';
    result.quality = output.result.length > 1 ? 'fuzzy' : result.quality;
  }

  // Second
  if (output.next.length > 0) {
    output = parseNext(output.next, [':'], 2);
    result.second = output.result;
    result.accuracy = 'second';
    result.quality = output.result.length > 1 ? 'fuzzy' : result.quality;
  }

  // Timezone
  if (output.next.length > 0) {
    if (output.next[0] === 'Z') {
      result.timezone = '+00:00';
      output.next = output.next.slice(1);
    } else if (output.next[0] === '-' || output.next[0] === '+') {
      const parts = splitAt(output.next, 6);
      result.timezone = parts[0];
      output.next = parts[1];
    } else {
      throw new Error('Expected a - or +');
    }
  }

  if (output.next.length > 0 && output.result.length > 1) {
    throw new Error('Can not add more information after range');
  } else if (output.next.length > 0 && result.timezone) {
    throw new Error('Can not add more information after timezone');
  }

  if (!result.timezone && result.quality !== 'fuzzy') {
    result.quality = 'partial';
  }

  const utcRanges = calculateRanges(result);

  assert(utcRanges.length > 0, 'Could not calculate ranges from spec');

  return {
    input,
    accuracy: result.accuracy,
    quality: result.quality,
    utcTimestamp: utcRanges[0].start,
    utcRanges,
  };
};

const getInstant = (spec: DatetimeInstantSpec) => {
  const year = typeof spec.year !== "undefined" ? `${spec.year}`.padStart(4, "0") : "0000";
  const month = typeof spec.month !== "undefined" ? `${spec.month}`.padStart(2, "0") : "01";
  const day = typeof spec.day !== "undefined" ? `${spec.day}`.padStart(2, "0") : "01";
  const hour = typeof spec.hour !== "undefined" ? `${spec.hour}`.padStart(2, "0") : "00";
  const minute = typeof spec.minute !== "undefined" ? `${spec.minute}`.padStart(2, "0") : "00";
  const second = typeof spec.second !== "undefined" ? `${spec.second}`.padStart(2, "0") : "00";

  return Temporal.Instant.from(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
}

const minTimestamp = (spec: DatetimeInstantSpec) => {
  const instant = getInstant(spec);
  return instant.epochSeconds;
};

const maxTimestamp = (spec: DatetimeInstantSpec) => {
  if (spec.minute) {
    spec.minute++;

    if (spec.minute > 60) {
      spec.hour!++;
      spec.minute = 0;
    }
  }



  if (spec.accuracy === "year") {
    spec.year++;
  } else if (spec.accuracy === "month") {
    spec.month!++;
    if (spec.month! > 12) {
      spec.month = 1;
      spec.year++;
    }
  }  else if (spec.accuracy === "day") {
    const month = Temporal.PlainYearMonth.from(`${spec.year}-${`${spec.day}`.padStart(2, "0")}`);

    spec.day!++;
    if (spec.day! > month.daysInMonth) {
      spec.day = 1;
      spec.month!++;
    }
  }


  const instant = getInstant({ ...spec, [spec.accuracy]: });

  const instant = Temporal.Instant.from(`${year + 1}-01-01T00:00:00Z`).subtract({ seconds: 1 });
  return instant.epochSeconds;
};

const calculateRanges = (obj: DatetimeObject): DatetimeRange[] => {
  const ranges: DatetimeRange[] = [];
  console.log(obj);
  // ranges.push({ start: 0, end: 0 });

  '2020|2021 => 2020(s)-2021(e)';
  '2020-04|05 => 2020-04(s)-2020-05(e)';
  '2020|2021-04|05 => 2020-04(s)-2020-05(e),2021-04(s)-2021-05(e)';
  '2020|2021-04|05-02 => 2020-04-02(s)-2020-05-02(e),2021-04-02(s)-2021-05-02(e)';

  if (obj.accuracy === 'year') {
    if (obj.year.length === 1) {
      const start = minTimestamp(obj.year[0]);
      ranges.push({ start, end: start });
    } else {
      const start = minTimestamp(obj.year[0]);
      const end = maxTimestamp(obj.year[1]);
      ranges.push({ start, end });
    }
  }

  // const rawRanges: number[][] = [];

  // for (const year of obj.year) {
  //   if (obj.second.length === 0) {

  //   } else
  //   for (const month of obj.month) {
  //     if (obj.second.length === 0) {

  //     } else
  //     for (const day of obj.day) {
  //       if (obj.second.length === 0) {

  //       } else
  //       for (const hour of obj.hour) {
  //         if (obj.second.length === 0) {

  //         } else
  //         for (const minute of obj.minute) {

  //           if (obj.second.length === 0) {

  //           } else
  //             for (const second of obj.second) {

  //             }
  //           }
  //         }
  //       }
  //     }
  //   }
  // }

  return ranges;
};

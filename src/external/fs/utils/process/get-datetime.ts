import { FSFileMetaDatetime } from '~/src/external/fs/types.ts';

/**
 * Parses a date string and returns the extracted date and time components.
 *
 * @param dateStr - The date string to parse.
 * @returns An object containing the parsed date and time components.
 * @throws If the date string cannot be parsed.
 */
export const getDatetime = (dateStr: string): FSFileMetaDatetime => {
  let timezone: string | undefined;

  const matches = dateStr.match(/([0-9 ]{4})[:/]([0-9 ]{2})[:/]([0-9 ]{2}) ([0-9 ]{2}):([0-9 ]{2}):?([0-9 ]{2})?(?:\.[0-9]+)?([\+|\-|Z].*)?/);

  if (!matches) {
    throw new Error(`Failed to parse exif data "${dateStr}"`);
  }

  const parts = matches.map((v) => v ? (v.trim() || undefined) : undefined);

  if (parts[7] === 'Z') {
    timezone = '+00:00';
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

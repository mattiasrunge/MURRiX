export type DatetimeObject = {
  year?: string | string[];
  month?: string | string[];
  day?: string | string[];
  hour?: string | string[];
  minute?: string | string[];
  second?: string | string[];
  timezone?: string;
};

export type DatetimeSpec = {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  timezone?: string;
};

export type DatetimeQuality = false | 'local' | 'utc' | 'fuzzy';
export type DatetimeAccuracy = false | 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';

export type DatetimeSources = {
  manual?: DatetimeObject;
  gps?: DatetimeObject;
  device?: DatetimeObject;
};
export type DatetimeType = keyof DatetimeSources;

export type DatetimeSource = {
  time: DatetimeObject;
  type: DatetimeType;
};

export type DatetimeParams = {
  type: DatetimeType;
  deviceAutoDst: boolean;
  deviceUtcOffset: number;
};

export type DatetimeOut = {
  timestamp: number | false;
  quality: DatetimeQuality;
  accuracy: DatetimeAccuracy;
  type?: DatetimeType;
};

// NEW

export type DatetimeManualInput = {
  year: string | string[];
  month?: string | string[];
  day?: string | string[];
  hour?: string | string[];
  minute?: string | string[];
  second?: string | string[];
  timezone?: string;
};

export type DatetimeDeviceInput = {
  year?: string;
  month?: string;
  day?: string;
  hour?: string;
  minute?: string;
  second?: string;
  timezone: string | false;
};

export type DatetimeGpsInput = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
  timezone: string;
};





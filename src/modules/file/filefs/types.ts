export type FileMetaDevice = {
  serialNumber?: string;
  model?: string;
  make?: string;
};

export type FileMetaFile = {
  number?: string;
  width?: number;
  height?: number;
  fps?: number;
  iso?: number;
  exposure?: number;
  frames?: number;
  duration?: number;
};

export type FileMetaLocation = {
  longitude?: string;
  latitude?: string;
  altitude?: string;
  country?: string;
  state?: string;
  city?: string;
  landmark?: string;
  area?: string;
};

export type FileMetaDataTime = {
  year?: string;
  month?: string;
  day?: string;
  hour?: string;
  minute?: string;
  second?: string;
  timezone: string | false;
};

export type FileMetaLayout = {
  width?: number;
  height?: number;
  angle?: number;
};

export type FileMeta = {
  type: string;
  device: FileMetaDevice;
  file: FileMetaFile;
  isRaw: boolean;
  location: FileMetaLocation;
  datetime: Record<string, FileMetaDataTime>;
  layout: FileMetaLayout;
};

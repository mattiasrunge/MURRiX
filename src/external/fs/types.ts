import { UserId } from '~/src/shared/mode/types.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { JSONValue } from '~/src/shared/types.ts';

export type FSAreaConfig = {
  name: string;
  path: string;
  hasUpload?: boolean;
  hasRemoved?: boolean;
};

export type FSConfig = {
  areas: FSAreaConfig[];
  maxIdIterations?: number;
  uploadExpireMs?: number;
  uploadCleanupMs?: number;
};

export type FSUploadMeta = {
  filename: string;
  path: string;
};

export type FSFileInfoMeta = Record<string, string>;
export type FSFileInfo = {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  sha256: string;
  createdAt: string;
  createdBy: UserId;
  meta: FSFileInfoMeta;
};

export type FSFileInfoEx = FSFileInfo & {
  area: string;
  uploadMeta: FSUploadMeta;
  fileMeta: FSFileMeta;
};

export type FSVerifyResult = {
  ok: boolean;
  type: string;
  expected: string;
  actual: string;
};

export type FSOnCommit = (access: Access, info: FSFileInfoEx) => Promise<FSFileInfoMeta>;

export type FSFileMetaDevice = {
  serialNumber?: string;
  model?: string;
  make?: string;
};

export type FSFileMetaFile = {
  number?: string;
  width?: number;
  height?: number;
  fps?: number;
  iso?: number;
  exposure?: number;
  frames?: number;
  duration?: number;
};

export type FSFileMetaLocation = {
  longitude?: string;
  latitude?: string;
  altitude?: string;
  country?: string;
  state?: string;
  city?: string;
  landmark?: string;
  area?: string;
};

export type FSFileMetaDataTime = {
  year?: string;
  month?: string;
  day?: string;
  hour?: string;
  minute?: string;
  second?: string;
  timezone: string | false;
};

export type FSFileMetaLayout = {
  width?: number;
  height?: number;
  angle?: number;
};

export type FSFileMeta = {
  raw: Record<string, JSONValue>;
  type: string;
  device: FSFileMetaDevice;
  file: FSFileMetaFile;
  isRaw: boolean;
  location: FSFileMetaLocation;
  datetime: Record<string, FSFileMetaDataTime>;
  layout: FSFileMetaLayout;
};

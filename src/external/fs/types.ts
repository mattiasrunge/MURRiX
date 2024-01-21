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

export type FSFileInfo = {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  sha256: string;
  createdAt: string;
};

export type FSVerifyResult = {
  ok: boolean;
  type: string;
  expected: string;
  actual: string;
};

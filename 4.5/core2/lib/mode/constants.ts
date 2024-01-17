import { ModeMask } from './types.ts';

export const MaskOwner: ModeMask = {
  READ: 0o400,
  WRITE: 0o200,
  EXEC: 0o100,
};

export const MaskGroup: ModeMask = {
  READ: 0o040,
  WRITE: 0o020,
  EXEC: 0o010,
};

export const MaskOther: ModeMask = {
  READ: 0o004,
  WRITE: 0o002,
  EXEC: 0o001,
};

export const MaskACL: ModeMask = {
  READ: 0o004,
  WRITE: 0o002,
  EXEC: 0o001,
};

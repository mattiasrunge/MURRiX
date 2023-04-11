import { AccessMode } from './types.ts';

export type ModeStringOptions = {
  acl?: boolean;
  owner?: boolean;
  group?: boolean;
  other?: boolean;
};

export type Mask = {
  READ: number;
  WRITE: number;
  EXEC: number;
};

export const MaskOwner: Mask = {
  READ: 0o400,
  WRITE: 0o200,
  EXEC: 0o100,
};

export const MaskGroup: Mask = {
  READ: 0o040,
  WRITE: 0o020,
  EXEC: 0o010,
};

export const MaskOther: Mask = {
  READ: 0o004,
  WRITE: 0o002,
  EXEC: 0o001,
};

export const MaskACL: Mask = {
  READ: 0o004,
  WRITE: 0o002,
  EXEC: 0o001,
};

export const getMode = (modestr: string, masks: Mask) => {
  let mode = 0;

  mode |= modestr.includes('r') ? masks.READ : 0;
  mode |= modestr.includes('w') ? masks.WRITE : 0;
  mode |= modestr.includes('x') ? masks.EXEC : 0;

  return mode;
};

export const checkMode = (mode: number, modestr: string, masks: Mask) => {
  const modeLevel = getMode(modestr, masks);

  return (mode & modeLevel) > 0;
};

export const modeStringType = (mode: AccessMode, mask: Mask) => {
  let str = '';

  str += mode & mask.READ ? 'r' : '-';
  str += mode & mask.WRITE ? 'w' : '-';
  str += mode & mask.EXEC ? 'x' : '-';

  return str;
};

export const getModeString = (mode: AccessMode, options?: ModeStringOptions) => {
  let modestr = '';

  if (options?.acl) {
    modestr += modeStringType(mode, MaskACL);
  }

  if (!options || options?.owner) {
    modestr += modeStringType(mode, MaskOwner);
  }

  if (!options || options?.group) {
    modestr += modeStringType(mode, MaskGroup);
  }

  if (!options || options?.other) {
    modestr += modeStringType(mode, MaskOther);
  }

  return modestr;
};

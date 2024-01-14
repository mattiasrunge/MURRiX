import { MaskACL, MaskGroup, MaskOther, MaskOwner } from './constants.ts';
import { Mode, ModeMask, ModeStringOptions } from './types.ts';

export const getMode = (modestr: string, masks: ModeMask) => {
  let mode = 0;

  mode |= modestr.includes('r') ? masks.READ : 0;
  mode |= modestr.includes('w') ? masks.WRITE : 0;
  mode |= modestr.includes('x') ? masks.EXEC : 0;

  return mode;
};

export const checkMode = (mode: number, modestr: string, masks: ModeMask) => {
  const modeLevel = getMode(modestr, masks);

  return (mode & modeLevel) > 0;
};

export const modeStringMask = (mode: Mode, mask: ModeMask) => {
  let str = '';

  str += mode & mask.READ ? 'r' : '-';
  str += mode & mask.WRITE ? 'w' : '-';
  str += mode & mask.EXEC ? 'x' : '-';

  return str;
};

export const getModeString = (mode: Mode, options?: ModeStringOptions) => {
  let modestr = '';

  if (options?.acl) {
    modestr += modeStringMask(mode, MaskACL);
  }

  if (!options || options?.owner) {
    modestr += modeStringMask(mode, MaskOwner);
  }

  if (!options || options?.group) {
    modestr += modeStringMask(mode, MaskGroup);
  }

  if (!options || options?.other) {
    modestr += modeStringMask(mode, MaskOther);
  }

  return modestr;
};

import { utils } from 'ssh2';
import { MaskGroup, MaskOther, MaskOwner, modeStringMask } from '~/lib/mode/mod.ts';
import { Attributes } from './types.ts';

export const longname = (name: string, entry: Deno.DirEntry | Deno.FileInfo, attrs: Attributes, num: number) => {
  let str = '-';

  if (entry.isDirectory) {
    str = 'd';
  } else if (entry.isSymlink) {
    str = 'l';
  }

  str += modeStringMask(attrs.mode, MaskOwner);
  str += modeStringMask(attrs.mode, MaskGroup);
  str += modeStringMask(attrs.mode, MaskOther);
  str += ' ';
  str += num;
  str += ' ';
  str += attrs.uid;
  str += ' ';
  str += attrs.gid;
  str += ' ';
  str += attrs.size;
  str += ' ';
  str += new Date(attrs.mtime).toDateString().slice(4);
  str += ' ';
  str += name;

  return str;
};

export const flagsToOpenOpts = (flags: number): Deno.OpenOptions => {
  const opts: Deno.OpenOptions = {};

  if (flags & utils.sftp.OPEN_MODE.READ) {
    opts.read = true;
  } else if (flags & utils.sftp.OPEN_MODE.WRITE) {
    opts.write = true;
  }

  if (flags & utils.sftp.OPEN_MODE.CREAT) {
    opts.create = true;
  }

  if (flags & utils.sftp.OPEN_MODE.APPEND) {
    opts.append = true;
  }

  // TODO: Implement EXCL if needed
  // if (flags & utils.sftp.OPEN_MODE.EXCL) {
  // }

  if (flags & utils.sftp.OPEN_MODE.TRUNC) {
    opts.truncate = true;
  }

  return opts;
};

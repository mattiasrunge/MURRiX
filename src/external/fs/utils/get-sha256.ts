import { crypto } from 'std/crypto/mod.ts';
import { encodeHex } from 'std/encoding/hex.ts';

export const getSha256 = async (filename: string) => {
  const file = await Deno.open(filename, { read: true, write: false });
  const buffer = await crypto.subtle.digest('SHA-256', file.readable);

  return encodeHex(buffer);
};

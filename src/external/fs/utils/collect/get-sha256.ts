import { crypto } from '@std/crypto';
import { encodeHex } from '@std/encoding';

/**
 * Calculates the SHA-256 hash of a file.
 *
 * @param filename - The path to the file.
 * @returns A promise that resolves to the SHA-256 hash of the file.
 */
export const getSha256 = async (filename: string) => {
  const file = await Deno.open(filename, { read: true, write: false });
  const buffer = await crypto.subtle.digest('SHA-256', file.readable);

  return encodeHex(buffer);
};

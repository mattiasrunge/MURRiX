import { Crc32Stream } from 'crc32';

export const crc32file = async (filename: string) => {
  const input = await Deno.open(filename, { read: true, write: false });
  const inputReader = input.readable.getReader();
  const crc32Stream = new Crc32Stream();

  let done = false;
  do {
    const result = await inputReader.read();
    done = result.done;

    if (result.value) {
      crc32Stream.append(result.value);
    }
  } while (!done);

  return crc32Stream.crc32;
};

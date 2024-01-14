import { encodeBase64 } from 'std/encoding/base64.ts';
import { basename } from 'std/path/mod.ts';

export const uploadCreate = async (token: string, baseUrl: string, filename: string, size?: number) => {
  const stat = size ? { size } : await Deno.stat(filename);
  const name = basename(filename);

  const res = await fetch(`${baseUrl}/staging`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Length': '0',
      'Upload-Length': `${stat.size}`,
      'Tus-Resumable': '1.0.0',
      'Upload-Metadata': `filename ${encodeBase64(name)}`,
    },
  });

  await res.body?.cancel();

  return res;
};

export const uploadFile = async (token: string, url: string, filename: string) => {
  const stat = await Deno.stat(filename);
  const file = await Deno.open(filename, { read: true });

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/offset+octet-stream',
      'Content-Length': `${stat.size}`,
      'Upload-Offset': '0',
      'Tus-Resumable': '1.0.0',
    },
    body: file.readable,
  });

  return res;
};

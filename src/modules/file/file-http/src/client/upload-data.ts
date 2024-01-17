export const uploadData = async (token: string, url: string, data: string, offset?: number) => {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/offset+octet-stream',
      'Content-Length': `${data.length}`,
      'Upload-Offset': offset ? `${offset}` : '0',
      'Tus-Resumable': '1.0.0',
    },
    body: data,
  });

  return res;
};

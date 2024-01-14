export const uploadInfo = async (token: string, url: string) => {
  const res = await fetch(url, {
    method: 'HEAD',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Tus-Resumable': '1.0.0',
    },
  });

  return res;
};

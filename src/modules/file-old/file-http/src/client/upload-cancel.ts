export const uploadCancel = async (token: string, url: string) => {
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Tus-Resumable': '1.0.0',
    },
  });

  return res;
};

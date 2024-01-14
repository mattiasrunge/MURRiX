export const fileInfo = async (token: string, baseUrl: string, fileId: string) => {
  const res = await fetch(`${baseUrl}/files/${fileId}/info`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return res;
};

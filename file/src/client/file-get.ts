export const fileGet = async (token: string, baseUrl: string, fileId: string) => {
  const res = await fetch(`${baseUrl}/files/${fileId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return res;
};

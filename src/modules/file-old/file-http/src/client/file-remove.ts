export const fileRemove = async (token: string, baseUrl: string, fileId: string) => {
  const res = await fetch(`${baseUrl}/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  await res.body?.cancel();

  return res;
};

export const commit = async (token: string, baseUrl: string, stagedId: string, ownerId: string) => {
  const res = await fetch(`${baseUrl}/commit/${stagedId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Owner-Id': ownerId,
    },
  });

  return res;
};

export const generateId = async () => {
  return crypto.randomUUID().split('-').slice(1, 4).join('-');
};

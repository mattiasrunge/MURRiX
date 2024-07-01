/**
 * Retrieves the value associated with the specified key from the local storage.
 *
 * @param key - The key of the value to retrieve.
 * @returns The value associated with the specified key, or `null` if the key does not exist.
 */
export const localStorageGet = (key: string) => {
  const value = localStorage.getItem(key);
  return value === null ? null : JSON.parse(value);
};

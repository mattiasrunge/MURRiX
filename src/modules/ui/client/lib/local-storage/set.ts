/**
 * Sets a value in the local storage with the specified key.
 * If the value is `undefined`, the key will be removed from the local storage.
 * @param key - The key to set in the local storage.
 * @param value - The value to set in the local storage.
 */
export const localStorageSet = (key: string, value: any) => {
  if (typeof value === 'undefined') {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

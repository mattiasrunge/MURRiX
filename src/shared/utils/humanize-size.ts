/**
 * Converts a size in bytes to a human-readable format.
 *
 * @param bytes - The size in bytes.
 * @returns A string representing the human-readable size.
 */
export const humanizeSize = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;

  while (bytes >= 1024 && index < units.length - 1) {
    bytes /= 1024;
    index++;
  }

  return `${bytes.toFixed(2)} ${units[index]}`;
};

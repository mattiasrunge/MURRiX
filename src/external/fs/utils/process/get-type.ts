/**
 * Returns the type of a given mimetype.
 *
 * @param mimetype - The mimetype to get the type from.
 * @returns The type of the mimetype.
 */
export const getType = (mimetype: string) => {
  return mimetype.split('/')[0];
};

import { assert } from 'std/assert/mod.ts';

/**
 * @description Assert that a name is valid.
 */
export const assertName = (name: string) => {
  assert(name.length > 0, 'name is required');
  assert(name.length < 256, 'name is too long');
  assert(name !== '.', 'name can not be a single dot');
  assert(name !== '..', 'name can not be a just two dots');
  assert(name.match(/^[a-zA-Z0-9_\-\.]+$/), 'name is invalid');
};

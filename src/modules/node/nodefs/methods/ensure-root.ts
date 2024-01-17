import { Collection } from 'mongo';
import { NodeData } from '../types.ts';
import { ADMIN_ACCESS } from '~/src/shared/access/mod.ts';
import { resolveOne } from './resolve-one.ts';
import { insert } from './insert.ts';

export const ensureRoot = async (col: Collection<NodeData>) => {
  try {
    return await resolveOne(col, ADMIN_ACCESS, '/');
  } catch {
    return await insert(col, ADMIN_ACCESS, 'r');
  }
};

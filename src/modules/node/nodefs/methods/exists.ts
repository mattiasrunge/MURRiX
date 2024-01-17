import { Collection } from 'mongo';
import { Access } from '~/src/shared/access/mod.ts';
import { NodeData, NodePath } from '../types.ts';
import { resolveOne } from './resolve-one.ts';

export const exists = async (
  col: Collection<NodeData>,
  access: Access,
  path: NodePath,
) => {
  try {
    await resolveOne(col, access, path);
    return true;
  } catch {
    return false;
  }
};

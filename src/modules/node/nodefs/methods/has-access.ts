import { Collection } from '@db/mongo';
import { Access, AccessLevel } from '~/src/shared/access/mod.ts';
import { NodeData, NodePath } from '../types.ts';
import { verifyAccess } from '../utils/mod.ts';
import { resolveOne } from './resolve-one.ts';

export const hasAccess = async (
  col: Collection<NodeData>,
  access: Access,
  path: NodePath,
  level: AccessLevel,
) => {
  try {
    const nodeData = await resolveOne(col, access, path);

    return verifyAccess(access, nodeData, level);
  } catch {
    return false;
  }
};

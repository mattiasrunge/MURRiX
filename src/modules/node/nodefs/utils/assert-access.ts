import { Access, AccessLevel } from '~/src/shared/access/mod.ts';
import { NodeData } from '../types.ts';
import { verifyAccess } from './verify-access.ts';

/**
 * @description Assert that access has the required level for the node.
 */
export const assertAcccess = (
  access: Access,
  nodeData: NodeData,
  level: AccessLevel,
) => {
  if (!verifyAccess(access, nodeData, level)) {
    throw new Error('permission denied');
  }
};

import { Collection } from '@db/mongo';
import { Access, AccessLevel, ADMIN_ACCESS } from '~/src/shared/access/mod.ts';
import { NodeData } from '../types.ts';
import { assertAcccess } from '../utils/mod.ts';
import { children } from './children.ts';

/**
 * @description Assert that access has the required level for the node and all its children.
 */
export const assertAccessRecursive = async (
  col: Collection<NodeData>,
  access: Access,
  nodeData: NodeData,
  level: AccessLevel,
) => {
  assertAcccess(access, nodeData, level);

  const childList = await children(col, ADMIN_ACCESS, nodeData._id, {
    nofollow: true,
  });

  await Promise.all(childList.map((c) => assertAccessRecursive(col, access, c, level)));
};

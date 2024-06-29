import { Collection } from '@db/mongo';
import { JSONValue } from '~/src/shared/types.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { NodeData } from '../types.ts';
import { verifyAccess } from '../utils/mod.ts';

/**
 * @description Find node data based on query and filter on read access.
 */
export const find = async (
  col: Collection<NodeData>,
  access: Access,
  query: Record<string, JSONValue>,
) => {
  const cursor = await col.find(query);
  const nodeDataList = await cursor.toArray();

  return nodeDataList.filter((nodeData) => verifyAccess(access, nodeData, 'r'));
};

import { Collection } from '@db/mongo';
import { JSONValue } from '~/src/shared/types.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { NodeData } from '../types.ts';
import { assertAcccess } from '../utils/mod.ts';

/**
 * @description Find one piece of node data based on a query, throw error if
 * nothing found or no read permissions.
 */
export const findOne = async (
  col: Collection<NodeData>,
  access: Access,
  query: Record<string, JSONValue>,
) => {
  const nodeData = await col.findOne(query);

  if (!nodeData) {
    throw new Error('no matching node found');
  }

  assertAcccess(access, nodeData, 'r');

  return nodeData;
};

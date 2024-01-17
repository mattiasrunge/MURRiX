import { Collection } from 'mongo';
import { Access } from '~/src/shared/access/mod.ts';
import { NodeData, NodeId } from '../types.ts';
import { assertAccessRecursive } from './assert-access-recursive.ts';
import { findOne } from './find-one.ts';
import { removeRecursive } from './remove-recursive.ts';

/**
 * @description Delete a node from the database.
 */
export const removeById = async (
  col: Collection<NodeData>,
  access: Access,
  id: NodeId,
) => {
  const nodeData = await findOne(col, access, { _id: id });

  if (nodeData.props.count > 0) {
    throw new Error('cannot remove node still attached to other nodes');
  }

  await assertAccessRecursive(col, access, nodeData, 'w');
  await removeRecursive(col, access, id, nodeData.props.group);

  return true;
};

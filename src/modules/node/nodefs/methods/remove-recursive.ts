import { Collection } from '@db/mongo';
import { Access } from '~/src/shared/access/mod.ts';
import { NodeData, NodeId } from '../types.ts';
import { findOne } from './find-one.ts';
import { children } from './children.ts';
import { removeChild } from './remove-child.ts';
import { assertAccessRecursive } from './assert-access-recursive.ts';

export const removeRecursive = async (
  col: Collection<NodeData>,
  access: Access,
  id: NodeId,
  group?: string,
) => {
  const childList = await children(col, access, id, {
    nofollow: true,
  });

  for (const child of childList) {
    const { childData } = await removeChild(col, access, id, child.name);

    if (childData.props.count === 0) {
      await removeRecursive(col, access, child._id, childData.props.group);
    }
  }

  await col.deleteOne({ _id: id });

  if (group) {
    try {
      const nodeData = await findOne(col, access, { 'props.group': group });

      await assertAccessRecursive(col, access, nodeData, 'w');
      await removeRecursive(col, access, nodeData._id, group);
    } catch {
      // Do nothing, this is not a fatal error
    }
  }
};

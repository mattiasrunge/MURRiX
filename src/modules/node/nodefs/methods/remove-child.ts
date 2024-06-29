import { Collection } from '@db/mongo';
import { Access } from '~/src/shared/access/mod.ts';
import { NodeData, NodeId, NodeParentAndChild } from '../types.ts';
import { assertAcccess } from '../utils/mod.ts';
import { findOne } from './find-one.ts';
import { setProps } from './set-props.ts';

/**
 * @description Remove a child from a parent node.
 */
export const removeChild = async (
  col: Collection<NodeData>,
  access: Access,
  parentId: NodeId,
  childName: string,
): Promise<NodeParentAndChild> => {
  const pNodeData = await findOne(col, access, { _id: parentId });

  assertAcccess(access, pNodeData, 'w');

  const children = pNodeData.props.children.slice(0);
  const child = children.find(({ name }) => name === childName);

  if (!child) {
    throw new Error('not a child on this node');
  }

  const cNodeData = await findOne(col, access, { _id: child.id });

  assertAcccess(access, cNodeData, 'w');

  const [
    childData,
    parentData,
  ] = await Promise.all([
    setProps(col, access, cNodeData._id, {
      count: cNodeData.props.count - 1,
    }),

    setProps(col, access, pNodeData._id, {
      children: children.filter((c) => c !== child),
    }),
  ]);

  return {
    childData,
    parentData,
  };
};

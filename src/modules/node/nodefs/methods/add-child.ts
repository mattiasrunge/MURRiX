import { Collection } from '@db/mongo';
import { Access } from '~/src/shared/access/mod.ts';
import { NodeData, NodeId, NodeParentAndChild } from '../types.ts';
import { assertAcccess } from '../utils/mod.ts';
import { assertName } from '../utils/mod.ts';
import { findOne } from './find-one.ts';
import { setProps } from './set-props.ts';

/**
 * @description Add a child to a parent node.
 */
export const addChild = async (
  col: Collection<NodeData>,
  access: Access,
  parentId: NodeId,
  childId: NodeId,
  childName: string,
): Promise<NodeParentAndChild> => {
  assertName(childName);

  const [
    pNodeData,
    cNodeData,
  ] = await Promise.all([
    findOne(col, access, { _id: parentId }),
    findOne(col, access, { _id: childId }),
  ]);

  assertAcccess(access, cNodeData, 'w');
  assertAcccess(access, pNodeData, 'w');

  if (pNodeData.props.children.some((c) => c.name === childName)) {
    throw new Error('name already taken');
  }

  // TODO: If we fail in one of these setProps but the other successed we will
  // have inconsistent data. We should probably use a transaction here.

  const [
    childData,
    parentData,
  ] = await Promise.all([
    setProps(col, access, cNodeData._id, {
      count: cNodeData.props.count + 1,
    }),
    setProps(col, access, pNodeData._id, {
      children: [
        ...pNodeData.props.children,
        {
          id: cNodeData._id,
          name: childName,
        },
      ],
    }),
  ]);

  return {
    childData,
    parentData,
  };
};

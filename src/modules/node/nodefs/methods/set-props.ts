import { Collection } from 'mongo';
import { Access } from '~/src/shared/access/mod.ts';
import { NodeData, NodeId, NodeSetPropsOptions, PartialNodeProps, PersistOps } from '../types.ts';
import { assertAcccess } from '../utils/mod.ts';
import { findOne } from './find-one.ts';
import { persist } from './persist.ts';

/**
 * @description Set the properties of a node.
 */
export const setProps = async (
  col: Collection<NodeData>,
  access: Access,
  id: NodeId,
  props: PartialNodeProps,
  options?: NodeSetPropsOptions,
): Promise<NodeData> => {
  const nodeData = await findOne(col, access, { _id: id });

  assertAcccess(access, nodeData, 'w');

  const ops: PersistOps = {
    $set: {},
    $unset: {},
  };
  ops.$set!['props.ptime'] = {
    uid: access.uid,
    timestamp: Date.now(),
  };

  for (const [key, value] of Object.entries(props)) {
    if (value === null) {
      ops.$unset![`props.${key}`] = '';
    } else {
      ops.$set![`props.${key}`] = value;
    }
  }

  const newNodeData = await persist(col, id, ops);

  if (options?.recursive) {
    for (const { id } of nodeData.props.children) {
      await setProps(col, access, id, props, options);
    }
  }

  return newNodeData;
};

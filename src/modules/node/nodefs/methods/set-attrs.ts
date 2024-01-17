import { Collection } from 'mongo';
import { Access } from '~/src/shared/access/mod.ts';
import { NodeAttrs, NodeData, NodeId, PersistOps } from '../types.ts';
import { assertAcccess } from '../utils/mod.ts';
import { findOne } from './find-one.ts';
import { persist } from './persist.ts';

/**
 * @description Set the attributes of a node.
 */
export const setAttrs = async (
  col: Collection<NodeData>,
  access: Access,
  id: NodeId,
  attrs: NodeAttrs,
): Promise<NodeData> => {
  const nodeData = await findOne(col, access, { _id: id });

  assertAcccess(access, nodeData, 'w');

  const timestamp = Date.now();
  const ops: PersistOps = {
    $set: {},
    $unset: {},
  };
  ops.$set!['props.atime'] = {
    uid: access.uid,
    timestamp,
  };
  ops.$set!['props.ptime'] = {
    uid: access.uid,
    timestamp,
  };

  for (const [key, value] of Object.entries(attrs)) {
    if (value === null) {
      ops.$unset![`attrs.${key}`] = '';
    } else {
      ops.$set![`attrs.${key}`] = value;
    }
  }

  return await persist(col, id, ops);
};

import { Collection } from 'mongo';
import { NodeData, NodeId, PersistOps } from '../types.ts';

/**
 * @description Persist a node to the database.
 */
export const persist = async (
  col: Collection<NodeData>,
  id: NodeId,
  ops: PersistOps,
) => {
  if (ops.$set && Object.keys(ops.$set).length === 0) {
    delete ops.$set;
  }

  if (ops.$unset && Object.keys(ops.$unset).length === 0) {
    delete ops.$unset;
  }

  const doc = await col.findAndModify({ _id: id }, {
    update: ops,
    upsert: true,
    new: true,
  });

  return doc!;
};

import { Collection } from 'mongo';
import { Access, DEFAULT_UMASK } from '~/src/shared/access/mod.ts';
import { NodeAttrs, NodeData, NodeProps, PartialNodeProps, PersistOps } from '../types.ts';
import { persist } from './persist.ts';

export const insert = async (
  col: Collection<NodeData>,
  access: Access,
  type: string,
  attrs?: NodeAttrs,
  props?: PartialNodeProps,
) => {
  const id = crypto.randomUUID();
  const timestamp = Date.now();

  const fullProps: NodeProps = {
    btime: {
      uid: access.uid,
      timestamp,
    },
    ptime: {
      uid: access.uid,
      timestamp,
    },
    atime: {
      uid: access.uid,
      timestamp,
    },
    mode: props?.mode ?? DEFAULT_UMASK,
    uid: props?.uid ?? access.uid,
    gid: props?.gid ?? access.gids[0],
    acl: props?.acl ?? [],
    children: props?.children ?? [],
    count: 0,
    files: props?.files ?? [],
    link: props?.link || undefined,
    group: props?.group || undefined,
  };

  const ops: PersistOps = {
    $set: {
      _id: id,
      type,
      props: fullProps,
      attrs: attrs || {},
    },
  };

  return await persist(col, id, ops);
};

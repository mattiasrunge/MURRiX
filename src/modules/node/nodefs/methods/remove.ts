import { basename, dirname } from 'std/path/mod.ts';
import { assert } from 'std/assert/mod.ts';
import { Collection } from 'mongo';
import { Access } from '~/src/shared/access/mod.ts';
import { NodeData, NodePath } from '../types.ts';
import { resolveOne } from './resolve-one.ts';
import { removeById } from './remove-by-id.ts';
import { removeChild } from './remove-child.ts';

export const remove = async (
  col: Collection<NodeData>,
  access: Access,
  path: NodePath,
) => {
  const dir = dirname(path);
  const name = basename(path);

  const [
    parent,
    node,
  ] = await Promise.all([
    resolveOne(col, access, dir),
    resolveOne(col, access, path, { readlink: true }),
  ]);

  assert(parent, 'parent node not found');
  assert(node, 'node not found');

  const { childData } = await removeChild(col, access, parent._id, name);

  if (childData.props.count === 0) {
    return await removeById(col, access, node._id);
  }

  return false;
};

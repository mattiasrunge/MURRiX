import { basename, dirname } from '@std/path';
import { assert } from '@std/assert';
import { Collection } from '@db/mongo';
import { Access } from '~/src/shared/access/mod.ts';
import { NodeData, NodePath } from '../types.ts';
import { assertName } from '../utils/mod.ts';
import { exists } from './exists.ts';
import { resolveOne } from './resolve-one.ts';
import { addChild } from './add-child.ts';

export const hardlink = async (
  col: Collection<NodeData>,
  access: Access,
  path: NodePath,
  targetPath: NodePath,
) => {
  // path does not exist, dirname of path is our parent path and basename of path is our name
  let name = basename(path);
  let parentPath = dirname(path);

  // path does exist, path is our target parent path, use name of target
  if (await exists(col, access, path)) {
    name = basename(targetPath);
    parentPath = path;
  }

  assertName(name);

  const [
    target,
    parent,
  ] = await Promise.all([
    resolveOne(col, access, targetPath, { readlink: true }),
    resolveOne(col, access, parentPath),
  ]);

  assert(target, 'target node not found');
  assert(parent, 'parent node not found');
  assert(parent.props.children.every((child) => child.name !== name), 'name already taken');
  assert(target._id !== parent._id, 'node can not be a child of itself');

  const { childData } = await addChild(col, access, parent._id, target._id, name);

  return childData;
};

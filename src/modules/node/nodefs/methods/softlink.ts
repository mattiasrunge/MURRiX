import { basename, dirname, normalize } from 'std/path/mod.ts';
import { assert } from 'std/assert/mod.ts';
import { Collection } from 'mongo';
import { Access } from '~/src/shared/access/mod.ts';
import { NodeAttrs, NodeData, NodePath, PartialNodeProps } from '../types.ts';
import { assertName } from '../utils/mod.ts';
import { exists } from './exists.ts';
import { resolveOne } from './resolve-one.ts';
import { insert } from './insert.ts';
import { addChild } from './add-child.ts';
import { removeById } from './remove-by-id.ts';

export const softlink = async (
  col: Collection<NodeData>,
  access: Access,
  path: NodePath,
  targetPath: NodePath,
  type: string,
  attrs?: NodeAttrs,
  props?: PartialNodeProps,
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

  const child = await insert(col, access, type, attrs, { link: normalize(targetPath), ...(props || {}) });

  try {
    const { childData } = await addChild(col, access, parent._id, child._id, name);

    return childData;
  } catch (error) {
    await removeById(col, access, child._id);
    throw error;
  }
};

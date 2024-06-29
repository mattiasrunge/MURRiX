import { basename, dirname, join } from '@std/path';
import { assert } from '@std/assert';
import { Collection } from '@db/mongo';
import { Access, ADMIN_ACCESS } from '~/src/shared/access/mod.ts';
import { NodeData, NodePath } from '../types.ts';
import { assertName } from '../utils/mod.ts';
import { exists } from './exists.ts';
import { resolveOne } from './resolve-one.ts';
import { setProps } from './set-props.ts';
import { make } from './make.ts';

export const copy = async (
  col: Collection<NodeData>,
  access: Access,
  srcPath: NodePath,
  dstPath: NodePath,
  inheritRights?: boolean,
) => {
  // destPath does not exist, dirname of destPath is our parent path and basename of destPath is our name
  let name = basename(dstPath);
  let parentPath = dirname(dstPath);

  // destPath does exist, destPath is our target parent path, use name of srcPath
  if (await exists(col, access, dstPath)) {
    name = basename(srcPath);
    parentPath = dstPath;
  }

  assertName(name);

  const [
    src,
    dstParent,
  ] = await Promise.all([
    resolveOne(col, access, srcPath, { readlink: true }),
    resolveOne(col, access, parentPath),
  ]);

  assert(src, 'src node not found');
  assert(dstParent, 'destination node not found');
  assert(dstParent.props.children.every((child) => child.name !== name), 'name already taken');
  assert(src._id !== dstParent._id, 'node can not be a child of itself');

  const newPath = join(parentPath, name);
  const newNode = await make(col, access, newPath, src.type, src.attrs, {
    ...src.props,
    children: [],
  });

  if (inheritRights) {
    await setProps(col, ADMIN_ACCESS, newNode._id, {
      uid: dstParent.props.uid,
      gid: dstParent.props.gid,
      mode: dstParent.props.mode,
      acl: dstParent.props.acl.slice(),
    }, { recursive: false });
  }

  for (const child of src.props.children) {
    await copy(col, access, join(srcPath, child.name), join(newPath, child.name), inheritRights);
  }

  return newNode;
};

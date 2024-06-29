import { basename, dirname, join, normalize } from '@std/path';
import { assert } from '@std/assert';
import { Collection } from '@db/mongo';
import { Access, ADMIN_ACCESS } from '~/src/shared/access/mod.ts';
import { NodeData, NodePath } from '../types.ts';
import { assertName } from '../utils/mod.ts';
import { exists } from './exists.ts';
import { resolveOne } from './resolve-one.ts';
import { addChild } from './add-child.ts';
import { removeChild } from './remove-child.ts';
import { setProps } from './set-props.ts';
import { find } from './find.ts';

export const move = async (
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
    currentParent,
  ] = await Promise.all([
    resolveOne(col, access, srcPath, { readlink: true }),
    resolveOne(col, access, parentPath),
    resolveOne(col, access, dirname(srcPath)),
  ]);

  assert(src, 'src node not found');
  assert(dstParent, 'destination node not found');
  assert(currentParent, 'current parent node not found');
  assert(dstParent.props.children.every((child) => child.name !== name), 'name already taken');
  assert(src._id !== dstParent._id, 'node can not be a child of itself');

  await removeChild(col, access, currentParent._id, basename(srcPath));
  const { childData } = await addChild(col, access, dstParent._id, src._id, name);

  if (inheritRights) {
    await setProps(col, ADMIN_ACCESS, childData._id, {
      uid: dstParent.props.uid,
      gid: dstParent.props.gid,
      mode: dstParent.props.mode,
      acl: dstParent.props.acl.slice(),
    }, { recursive: true });
  }

  // Find all soft links that point to the old path and redirect them
  const links = await find(col, ADMIN_ACCESS, {
    'props.link': normalize(srcPath),
  });

  for (const link of links) {
    await setProps(col, ADMIN_ACCESS, link._id, {
      link: normalize(join(parentPath, name)),
    });
  }

  return childData;
};

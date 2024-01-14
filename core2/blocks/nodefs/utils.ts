import { assert } from 'std/_util/asserts.ts';
import { basename, dirname, join, normalize } from 'std/path/mod.ts';
import { Access, AccessLevel, ADMIN_ACCESS, DEFAULT_UMASK } from './access/mod.ts';
import { NamedNodeData, NodeAttrs, NodeData, NodeProps, PartialNodeProps } from './types.ts';
import { NodeFS } from './nodefs.ts';
import { PersistOps } from './internal-types.ts';

const insert = async <T extends NodeAttrs = NodeAttrs>(nodefs: NodeFS, access: Access, type: string, attrs?: T, props?: PartialNodeProps) => {
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

  return await nodefs.persist<T>(id, ops);
};

export const make = async <T extends NodeAttrs = NodeAttrs>(
  nodefs: NodeFS,
  access: Access,
  path: string,
  type: string,
  attrs?: T,
  props?: PartialNodeProps,
): Promise<NamedNodeData<T>> => {
  const dir = dirname(path);
  const name = basename(path);

  nodefs.assertNameValid(name);

  const parent = await nodefs.resolveOne(access, dir);
  assert(parent, 'parent node not found');
  assert(parent.props.children.every((child) => child.name !== name), 'name already taken');

  const node = await insert<T>(nodefs, access, type, attrs, {
    mode: parent.props.mode,
    gid: parent.props.gid,
    acl: parent.props.acl,
    ...props,
  });

  try {
    const { childData } = await nodefs.addChild(access, parent._id, node._id, name);

    return {
      name,
      paths: [path],
      ...(childData as NodeData<T>),
    };
  } catch (error) {
    await nodefs.remove(access, node._id);
    throw error;
  }
};

export const exists = async (nodefs: NodeFS, access: Access, path: string) => {
  try {
    await nodefs.resolveOne(access, path);
    return true;
  } catch {
    return false;
  }
};

export const access = async (nodefs: NodeFS, access: Access, path: string, level: AccessLevel) => {
  try {
    const nodeData = await nodefs.resolveOne(access, path);

    return nodefs.verifyAccess(access, nodeData, level);
  } catch {
    return false;
  }
};

export const hardlink = async (nodefs: NodeFS, access: Access, path: string, targetPath: string) => {
  // path does not exist, dirname of path is our parent path and basename of path is our name
  let name = basename(path);
  let parentPath = dirname(path);

  // path does exist, path is our target parent path, use name of target
  if (await exists(nodefs, access, path)) {
    name = basename(targetPath);
    parentPath = path;
  }

  nodefs.assertNameValid(name);

  const [
    target,
    parent,
  ] = await Promise.all([
    nodefs.resolveOne(access, targetPath, { readlink: true }),
    nodefs.resolveOne(access, parentPath),
  ]);

  assert(target, 'target node not found');
  assert(parent, 'parent node not found');
  assert(parent.props.children.every((child) => child.name !== name), 'name already taken');
  assert(target._id !== parent._id, 'node can not be a child of itself');

  const { childData } = await nodefs.addChild(access, parent._id, target._id, name);

  return childData;
};

export const softlink = async (nodefs: NodeFS, access: Access, path: string, targetPath: string, type: string, attrs?: NodeAttrs, props?: PartialNodeProps) => {
  // path does not exist, dirname of path is our parent path and basename of path is our name
  let name = basename(path);
  let parentPath = dirname(path);

  // path does exist, path is our target parent path, use name of target
  if (await exists(nodefs, access, path)) {
    name = basename(targetPath);
    parentPath = path;
  }

  nodefs.assertNameValid(name);

  const [
    target,
    parent,
  ] = await Promise.all([
    nodefs.resolveOne(access, targetPath, { readlink: true }),
    nodefs.resolveOne(access, parentPath),
  ]);

  assert(target, 'target node not found');
  assert(parent, 'parent node not found');
  assert(parent.props.children.every((child) => child.name !== name), 'name already taken');

  const child = await insert(nodefs, access, type, attrs, { link: normalize(targetPath), ...(props || {}) });

  try {
    const { childData } = await nodefs.addChild(access, parent._id, child._id, name);

    return childData;
  } catch (error) {
    await nodefs.remove(access, child._id);
    throw error;
  }
};

export const move = async (nodefs: NodeFS, access: Access, srcPath: string, dstPath: string, inheritRights?: boolean) => {
  // destPath does not exist, dirname of destPath is our parent path and basename of destPath is our name
  let name = basename(dstPath);
  let parentPath = dirname(dstPath);

  // destPath does exist, destPath is our target parent path, use name of srcPath
  if (await exists(nodefs, access, dstPath)) {
    name = basename(srcPath);
    parentPath = dstPath;
  }

  nodefs.assertNameValid(name);

  const [
    src,
    dstParent,
    currentParent,
  ] = await Promise.all([
    nodefs.resolveOne(access, srcPath, { readlink: true }),
    nodefs.resolveOne(access, parentPath),
    nodefs.resolveOne(access, dirname(srcPath)),
  ]);

  assert(src, 'src node not found');
  assert(dstParent, 'destination node not found');
  assert(currentParent, 'current parent node not found');
  assert(dstParent.props.children.every((child) => child.name !== name), 'name already taken');
  assert(src._id !== dstParent._id, 'node can not be a child of itself');

  await nodefs.removeChild(access, currentParent._id, basename(srcPath));
  const { childData } = await nodefs.addChild(access, dstParent._id, src._id, name);

  if (inheritRights) {
    await nodefs.setProps(ADMIN_ACCESS, childData._id, {
      uid: dstParent.props.uid,
      gid: dstParent.props.gid,
      mode: dstParent.props.mode,
      acl: dstParent.props.acl.slice(),
    }, { recursive: true });
  }

  // Find all soft links that point to the old path and redirect them
  const links = await nodefs.find(ADMIN_ACCESS, {
    'props.link': normalize(srcPath),
  });

  for (const link of links) {
    await nodefs.setProps(ADMIN_ACCESS, link._id, {
      link: normalize(join(parentPath, name)),
    });
  }

  return childData;
};

export const copy = async (nodefs: NodeFS, access: Access, srcPath: string, dstPath: string, inheritRights?: boolean) => {
  // destPath does not exist, dirname of destPath is our parent path and basename of destPath is our name
  let name = basename(dstPath);
  let parentPath = dirname(dstPath);

  // destPath does exist, destPath is our target parent path, use name of srcPath
  if (await exists(nodefs, access, dstPath)) {
    name = basename(srcPath);
    parentPath = dstPath;
  }

  nodefs.assertNameValid(name);

  const [
    src,
    dstParent,
  ] = await Promise.all([
    nodefs.resolveOne(access, srcPath, { readlink: true }),
    nodefs.resolveOne(access, parentPath),
  ]);

  assert(src, 'src node not found');
  assert(dstParent, 'destination node not found');
  assert(dstParent.props.children.every((child) => child.name !== name), 'name already taken');
  assert(src._id !== dstParent._id, 'node can not be a child of itself');

  const newPath = join(parentPath, name);
  const newNode = await make(nodefs, access, newPath, src.type, src.attrs, {
    ...src.props,
    children: [],
  });

  if (inheritRights) {
    await nodefs.setProps(ADMIN_ACCESS, newNode._id, {
      uid: dstParent.props.uid,
      gid: dstParent.props.gid,
      mode: dstParent.props.mode,
      acl: dstParent.props.acl.slice(),
    }, { recursive: false });
  }

  for (const child of src.props.children) {
    await copy(nodefs, access, join(srcPath, child.name), join(newPath, child.name), inheritRights);
  }

  return newNode;
};

export const remove = async (nodefs: NodeFS, access: Access, path: string) => {
  const dir = dirname(path);
  const name = basename(path);

  const [
    parent,
    node,
  ] = await Promise.all([
    nodefs.resolveOne(access, dir),
    nodefs.resolveOne(access, path, { readlink: true }),
  ]);

  assert(parent, 'parent node not found');
  assert(node, 'node not found');

  const { childData } = await nodefs.removeChild(access, parent._id, name);

  if (childData.props.count === 0) {
    return await nodefs.remove(access, node._id);
  }

  return false;
};

export const ensureRoot = async (nodefs: NodeFS) => {
  try {
    return await nodefs.resolveOne(ADMIN_ACCESS, '/');
  } catch {
    return await insert(nodefs, ADMIN_ACCESS, 'r');
  }
};

export const uniqueName = async (nodefs: NodeFS, access: Access, path: string, name: string) => {
  const parent = await nodefs.resolveOne(access, path);

  const names = new Set(parent.props.children.map(({ name }) => name));
  const escapedName = name.trim()
    .replaceAll(/ |\//g, '_')
    .replaceAll(/(?![a-zA-Z0-9_\-\.]+$).*/g, '');

  let result = escapedName;
  let counter = 1;

  while (names.has(result)) {
    result = `${escapedName}_${counter}`;
    counter++;

    // Catch for if counter overflows, should probably never
    // happen in the real world but to be safe.
    assert(counter > 0, 'could not generate a unique child name, counter overflowed');
  }

  return result;
};

import { basename, dirname } from '@std/path';
import { assert } from '@std/assert';
import { Collection } from '@db/mongo';
import { Access } from '~/src/shared/access/mod.ts';
import { NamedNodeData, NodeAttrs, NodeData, NodePath, PartialNodeProps } from '../types.ts';
import { assertName } from '../utils/mod.ts';
import { removeById } from './remove-by-id.ts';
import { insert } from './insert.ts';
import { resolveOne } from './resolve-one.ts';
import { addChild } from './add-child.ts';

export const make = async (
  col: Collection<NodeData>,
  access: Access,
  path: NodePath,
  type: string,
  attrs?: NodeAttrs,
  props?: PartialNodeProps,
): Promise<NamedNodeData> => {
  const dir = dirname(path);
  const name = basename(path);

  assertName(name);

  const parent = await resolveOne(col, access, dir);
  assert(parent, 'parent node not found');
  assert(parent.props.children.every((child) => child.name !== name), 'name already taken');

  const node = await insert(col, access, type, attrs, {
    mode: parent.props.mode,
    gid: parent.props.gid,
    acl: parent.props.acl,
    ...props,
  });

  try {
    const { childData } = await addChild(col, access, parent._id, node._id, name);

    return {
      name,
      paths: [path],
      ...childData,
    };
  } catch (error) {
    await removeById(col, access, node._id);
    throw error;
  }
};

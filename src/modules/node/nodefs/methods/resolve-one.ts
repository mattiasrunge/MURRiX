import { assert } from 'std/assert/mod.ts';
import { basename, join, normalize } from 'std/path/mod.ts';
import { Collection } from 'mongo';
import { Access, ADMIN_ACCESS } from '~/src/shared/access/mod.ts';
import { NamedNodeData, NodeData, NodePath, NodeResolveOptions } from '../types.ts';
import { assertAcccess } from '../utils/mod.ts';
import { findOne } from './find-one.ts';

/**
 * @description Given a node path returns on node data with name and path, throws if nothing found, not readable
 * or if execution access is not granted for parent nodes.
 */
export const resolveOne = async (
  col: Collection<NodeData>,
  access: Access,
  path: NodePath,
  options?: NodeResolveOptions,
): Promise<NamedNodeData> => {
  assert(path.startsWith('/'), 'path must start with /');

  const pathParts = normalize(path).replace(/^\/|\/$/g, '').split('/').filter(Boolean);

  let currentpath = '/';
  let nodeData = await findOne(col, ADMIN_ACCESS, { type: 'r' });
  while (pathParts.length > 0) {
    assertAcccess(access, nodeData, 'x');

    const name = pathParts.shift() as string;
    const child = nodeData.props.children.find((c) => c.name === name);

    assert(child, `${path}: path not found`);

    currentpath = join(currentpath, name);
    nodeData = await findOne(col, ADMIN_ACCESS, { _id: child.id });

    if (nodeData.props.link && !(options?.nofollow || (options?.readlink && pathParts.length === 0))) {
      nodeData = await resolveOne(col, ADMIN_ACCESS, nodeData.props.link);
      assert(nodeData, `link in path did not resolve to accessible node`);
    }
  }

  assertAcccess(access, nodeData, 'r');

  return {
    ...nodeData,
    name: basename(currentpath),
    paths: [currentpath],
  };
};

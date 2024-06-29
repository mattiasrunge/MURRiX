import { assert } from '@std/assert';
import { basename, dirname, join, normalize } from '@std/path';
import { Collection } from '@db/mongo';
import { Access } from '~/src/shared/access/mod.ts';
import { NamedNodeData, NodeData, NodePath, NodeResolveOptions } from '../types.ts';
import { resolveOne } from './resolve-one.ts';
import { children } from './children.ts';

/**
 * @description Given a node path return a list of nodes, if an absolute path return a list
 * with just that node, if wildcard given return list of matching nodes.
 */
export const resolve = async (
  col: Collection<NodeData>,
  access: Access,
  path: NodePath,
  options?: NodeResolveOptions,
): Promise<NamedNodeData[]> => {
  assert(path.startsWith('/'), 'path must start with /');

  const normalPath = normalize(path).replace(/\/$/g, '');
  const name = basename(normalPath);
  const pattern = name.includes('*') ? name.replaceAll('*', '.*?') : false;
  const basePath = pattern ? dirname(normalPath) : normalPath;

  const namedNodeData = await resolveOne(col, access, basePath, options);

  if (pattern) {
    const childList = await children(col, access, namedNodeData._id, options);
    const expr = new RegExp(`^${pattern}$`, options?.caseSensitive ? '' : 'i');

    return childList
      .filter(({ name }) => expr.test(name))
      .map((child) => ({
        ...child,
        paths: [
          join(basePath, child.name),
        ],
      }));
  }

  return [namedNodeData];
};

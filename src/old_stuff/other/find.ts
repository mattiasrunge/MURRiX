import { join } from '@std/path';
import { Access, NamedNodeData, NodePath } from '~/lib/nodefs/mod.ts';
import { API, wrap } from '~/lib/api/mod.ts';

type I = {
  access: Access;
  path: NodePath;
  search: string;
};

type O = NamedNodeData[];

// TODO: Make into a nodefs utils function
const find = async (api: API, { access, path, search }: I) => {
  const guard: string[] = [];

  const pattern = search
    .replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&')
    .replaceAll(/-/g, '\\x2d')
    .replaceAll(/\\\*/g, '.*');
  const expr = new RegExp(`^${pattern}$`, 'i');

  const namedNodeData = await api.nodefs.resolveOne(access, path, { nofollow: true });
  const children = await api.nodefs.children(access, namedNodeData._id);

  const matched = children
    .filter(({ name }) => expr.test(name))
    .map((child) => ({
      ...child,
      paths: [
        join(path, child.name),
      ],
    }));

  for (const child of children) {
    if (guard.includes(child._id)) {
      continue;
    }

    guard.push(child._id);

    const list = await find(client, child, search);
    matched.push(...list);
  }

  return matched;
};

export default find;

export const resolve = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, path, search }: I) => {
    return await api.nodefs.resolve(access, path, options);
  },
);

import { assert } from '@std/assert';
import { Collection } from '@db/mongo';
import { Access } from '~/src/shared/access/mod.ts';
import { NodeData, NodePath } from '../types.ts';
import { resolveOne } from './resolve-one.ts';

export const uniqueName = async (
  col: Collection<NodeData>,
  access: Access,
  path: NodePath,
  name: string,
) => {
  const parent = await resolveOne(col, access, path);

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

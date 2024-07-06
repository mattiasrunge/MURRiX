import { assert } from '@std/assert';
import { ServiceIf } from '~/src/shared/service/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { apiNode, NamedNodeData, NodePath } from '~/src/modules/node/mod.ts';
import { PersonAttrs, PersonChildren, PersonParents, PersonTree } from '../../types.ts';
import { ApiIf } from '../if.ts';

const resolveParent = async (ctx: ApiContext<ServiceIf>, path: NodePath) => {
  try {
    return await apiNode.resolveOne(ctx, { path }) as NamedNodeData<PersonAttrs>;
  } catch {
    return null;
  }
};

const resolveChildren = async (ctx: ApiContext<ServiceIf>, path: NodePath) => {
  try {
    return await apiNode.resolve(ctx, { path }) as NamedNodeData<PersonAttrs>[];
  } catch {
    return [];
  }
};

const getParent = async (ctx: ApiContext<ServiceIf>, child: NamedNodeData<PersonAttrs>, which: 'father' | 'mother'): Promise<PersonParents | null> => {
  const person = await resolveParent(ctx, `${child.paths![0]}/parents/${which}`);

  if (!person) {
    return null;
  }

  const [
    mother,
    father,
  ] = await Promise.all([
    getParent(ctx, person, 'mother'),
    getParent(ctx, person, 'father'),
  ]);

  return {
    person,
    mother,
    father,
  };
};

const getChildren = async (ctx: ApiContext<ServiceIf>, parent: NamedNodeData<PersonAttrs>): Promise<PersonChildren[]> => {
  const children = await resolveChildren(ctx, `${parent.paths![0]}/children/*`);

  return await Promise.all(children.map(async (person) => ({
    person,
    children: await getChildren(ctx, person),
  })));
};

export const getFamily: ApiIf['getFamily'] = async (ctx: ApiContext<ServiceIf>, { path }) => {
  const person = await apiNode.resolveOne(ctx, { path }) as NamedNodeData<PersonAttrs>;

  assert(person.type === 'p', 'path must be a person');

  const tree: PersonTree = {
    person,
    mother: await getParent(ctx, person, 'mother'),
    father: await getParent(ctx, person, 'father'),
    children: await getChildren(ctx, person),
  };

  return tree!;
};

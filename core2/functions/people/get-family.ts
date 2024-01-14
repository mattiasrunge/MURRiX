import { assert } from 'std/_util/asserts.ts';
import { Access, NamedNodeData, NodePath } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { node } from '~/functions/node.ts';
import { PersonAttrs, PersonChildren, PersonParents, PersonTree } from './types.ts';

const resolveParent = async (api: API, access: Access, path: NodePath) => {
  try {
    return await node.resolveOne(api, { access, path }) as NamedNodeData<PersonAttrs>;
  } catch {
    return null;
  }
};

const resolveChildren = async (api: API, access: Access, path: NodePath) => {
  try {
    return await node.resolve(api, { access, path }) as NamedNodeData<PersonAttrs>[];
  } catch {
    return [];
  }
};

const getParent = async (api: API, access: Access, child: NamedNodeData<PersonAttrs>, which: 'father' | 'mother'): Promise<PersonParents | null> => {
  const person = await resolveParent(api, access, `${child.paths![0]}/parents/${which}`);

  if (!person) {
    return null;
  }

  const [
    mother,
    father,
  ] = await Promise.all([
    getParent(api, access, person, 'mother'),
    getParent(api, access, person, 'father'),
  ]);

  return {
    person,
    mother,
    father,
  };
};

const getChildren = async (api: API, access: Access, parent: NamedNodeData<PersonAttrs>): Promise<PersonChildren[]> => {
  const children = await resolveChildren(api, access, `${parent.paths![0]}/children/*`);

  return await Promise.all(children.map(async (person) => ({
    person,
    children: await getChildren(api, access, person),
  })));
};

type I = {
  access: Access;
  path: NodePath;
};

type O = PersonTree;

export const getFamily = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, path }: I) => {
    const person = await node.resolveOne(api, { access, path }) as NamedNodeData<PersonAttrs>;

    assert(person.type === 'p', 'path must be a person');

    const tree: PersonTree = {
      person,
      mother: await getParent(api, access, person, 'mother'),
      father: await getParent(api, access, person, 'father'),
      children: await getChildren(api, access, person),
    };

    return tree!;
  },
);

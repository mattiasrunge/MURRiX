import { assert } from 'std/_util/asserts.ts';
import { Access, NamedNodeData, NodePath } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';
import { PersonAttrs, PersonChildren, PersonParents, PersonTree } from './types.ts';

const resolveParent = async (api: API, access: Access, path: NodePath) => {
  try {
    return await api.nodefs.resolveOne<PersonAttrs>(access, path);
  } catch {
    return null;
  }
};

const resolveChildren = async (api: API, access: Access, path: NodePath) => {
  try {
    return await api.nodefs.resolve<PersonAttrs>(access, path);
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
    const person = await api.nodefs.resolveOne<PersonAttrs>(access, path);

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

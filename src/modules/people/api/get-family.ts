import { assert } from '@std/assert';
import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { NamedNodeData, nodeApi, NodePath } from '~/src/modules/node/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { PersonAttrs, PersonChildren, PersonParents, PersonTree } from '../types.ts';

const resolveParent = async (service: ServiceIf, access: Access, path: NodePath) => {
  try {
    return await nodeApi.resolveOne(service, { access, path }) as NamedNodeData<PersonAttrs>;
  } catch {
    return null;
  }
};

const resolveChildren = async (service: ServiceIf, access: Access, path: NodePath) => {
  try {
    return await nodeApi.resolve(service, { access, path }) as NamedNodeData<PersonAttrs>[];
  } catch {
    return [];
  }
};

const getParent = async (service: ServiceIf, access: Access, child: NamedNodeData<PersonAttrs>, which: 'father' | 'mother'): Promise<PersonParents | null> => {
  const person = await resolveParent(service, access, `${child.paths![0]}/parents/${which}`);

  if (!person) {
    return null;
  }

  const [
    mother,
    father,
  ] = await Promise.all([
    getParent(service, access, person, 'mother'),
    getParent(service, access, person, 'father'),
  ]);

  return {
    person,
    mother,
    father,
  };
};

const getChildren = async (service: ServiceIf, access: Access, parent: NamedNodeData<PersonAttrs>): Promise<PersonChildren[]> => {
  const children = await resolveChildren(service, access, `${parent.paths![0]}/children/*`);

  return await Promise.all(children.map(async (person) => ({
    person,
    children: await getChildren(service, access, person),
  })));
};

type I = {
  access: Access;
  path: NodePath;
};

type O = PersonTree;

export const getFamily = api<I, O>(
  async (service: ServiceIf, { access, path }: I) => {
    const person = await nodeApi.resolveOne(service, { access, path }) as NamedNodeData<PersonAttrs>;

    assert(person.type === 'p', 'path must be a person');

    const tree: PersonTree = {
      person,
      mother: await getParent(service, access, person, 'mother'),
      father: await getParent(service, access, person, 'father'),
      children: await getChildren(service, access, person),
    };

    return tree!;
  },
);

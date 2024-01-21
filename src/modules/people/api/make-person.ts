import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { NamedNodeData, nodeApi } from '~/src/modules/node/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { PersonAttrs } from '../types.ts';

type I = PersonAttrs & {
  access: Access;
};

type O = NamedNodeData<PersonAttrs>;

export const makePerson = api<I, O>(
  async (service: ServiceIf, { access, name, fullname, birthname, description, allergies, gender, contact }: I) => {
    const nodeName = await nodeApi.uniqueName(service, { access, path: '/people', name });

    await nodeApi.make(service, {
      access,
      path: `/people/${nodeName}`,
      type: 'p',
      attrs: {
        name,
        fullname: fullname || null,
        birthname: birthname || null,
        description: description || null,
        allergies: allergies || null,
        gender: gender || 'u',
        contact: contact || null,
      },
    });
    await nodeApi.make(service, {
      access,
      path: `/people/${nodeName}/children`,
      type: 'd',
    });
    await nodeApi.make(service, {
      access,
      path: `/people/${nodeName}/parents`,
      type: 'd',
    });
    await nodeApi.make(service, {
      access,
      path: `/people/${nodeName}/measurments`,
      type: 'd',
    });
    await nodeApi.make(service, {
      access,
      path: `/people/${nodeName}/texts`,
      type: 'd',
    });

    return await nodeApi.resolveOne(service, { access, path: `/people/${nodeName}` }) as O;
  },
);

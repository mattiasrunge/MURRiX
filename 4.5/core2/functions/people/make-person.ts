import { Access, NamedNodeData, utils } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import * as node from '~/functions/node/mod.ts';
import { PersonAttrs } from './types.ts';

type I = PersonAttrs & {
  access: Access;
};

type O = NamedNodeData<PersonAttrs>;

export const makePerson = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, name, fullname, birthname, description, allergies, gender, contact }: I) => {
    const nodeName = await node.uniqueName(api, { access, path: '/people', name });

    await utils.make<PersonAttrs>(api.nodefs, access, `/people/${nodeName}`, 'p', {
      name,
      fullname: fullname || null,
      birthname: birthname || null,
      description: description || null,
      allergies: allergies || null,
      gender: gender || 'u',
      contact: contact || null,
    });

    await utils.make(api.nodefs, access, `/people/${nodeName}/children`, 'd');
    await utils.make(api.nodefs, access, `/people/${nodeName}/parents`, 'd');
    await utils.make(api.nodefs, access, `/people/${nodeName}/measurments`, 'd');
    await utils.make(api.nodefs, access, `/people/${nodeName}/texts`, 'd');

    return await node.resolveOne(api, { access, path: `/people/${nodeName}` }) as O;
  },
);

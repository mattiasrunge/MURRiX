import { Access, NamedNodeData, utils } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';
import * as node from '../node/mod.ts';
import { PersonAttrs } from './types.ts';

type I = PersonAttrs & {
  access: Access;
};

type O = NamedNodeData;

export const makePerson = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, name, fullname, birthname, description, allergies, gender, contact }: I) => {
    const nodeName = await node.uniqueName(api, { access, path: '/people', name });
    const person = await utils.make(api.nodefs, access, `/people/${nodeName}`, 'p', {
      name,
      fullname: fullname || null,
      birthname: birthname || null,
      description: description || null,
      allergies: allergies || null,
      gender: gender || null,
      contact: contact || null,
    });

    await utils.make(api.nodefs, access, `/people/${nodeName}/children`, 'd');
    await utils.make(api.nodefs, access, `/people/${nodeName}/parents`, 'd');
    await utils.make(api.nodefs, access, `/people/${nodeName}/measurments`, 'd');
    await utils.make(api.nodefs, access, `/people/${nodeName}/texts`, 'd');

    return person;
  },
);

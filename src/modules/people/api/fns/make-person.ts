import { apiNode, NamedNodeData } from '~/src/modules/node/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { ServiceIf } from '~/src/shared/service/types.ts';
import { PersonAttrs } from '../../types.ts';
import { ApiIf } from '../if.ts';

export const makePerson: ApiIf['makePerson'] = async (ctx: ApiContext<ServiceIf>, { name, fullname, birthname, description, allergies, gender, contact }) => {
  const nodeName = await apiNode.uniqueName(ctx, { path: '/people', name });

  await apiNode.make(ctx, {
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
  await apiNode.make(ctx, {
    path: `/people/${nodeName}/children`,
    type: 'd',
  });
  await apiNode.make(ctx, {
    path: `/people/${nodeName}/parents`,
    type: 'd',
  });
  await apiNode.make(ctx, {
    path: `/people/${nodeName}/measurments`,
    type: 'd',
  });
  await apiNode.make(ctx, {
    path: `/people/${nodeName}/texts`,
    type: 'd',
  });

  return await apiNode.resolveOne(ctx, { path: `/people/${nodeName}` }) as NamedNodeData<PersonAttrs>;
};

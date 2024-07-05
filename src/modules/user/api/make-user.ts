import { NamedNodeData, nodeApi } from '~/src/modules/node/mod.ts';
import { ADMIN_ACCESS } from '~/src/shared/access/mod.ts';
import { UserAttrs } from '../types.ts';
import { newUid } from './new-uid.ts';
import { ApiIf } from '../api.ts';

export const makeUser: ApiIf['makeUser'] = async (service, { access, name, uid, title, description, passwordId }) => {
  uid = uid || await newUid(service, { access: ADMIN_ACCESS });

  await nodeApi.make(service, {
    access,
    path: `/users/${name}`,
    type: 'u',
    attrs: {
      uid,
      title: title || null,
      description: description || null,
      passwordId: passwordId || null,
    },
    props: {
      uid,
      mode: 0o570,
    },
  });

  await nodeApi.make(service, {
    access,
    path: `/users/${name}/files`,
    type: 'd',
    props: {
      uid,
      mode: 0o770,
    },
  });

  await nodeApi.make(service, {
    access,
    path: `/users/${name}/groups`,
    type: 'd',
    props: {
      uid,
      mode: 0o770,
    },
  });

  await nodeApi.make(service, {
    access,
    path: `/users/${name}/stars`,
    type: 'd',
    props: {
      uid,
      mode: 0o770,
    },
  });

  return await nodeApi.resolveOne(service, {
    access,
    path: `/users/${name}`,
  }) as NamedNodeData<UserAttrs>;
};

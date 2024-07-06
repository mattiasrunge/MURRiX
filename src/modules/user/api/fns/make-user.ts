import { ADMIN_ACCESS } from '~/src/shared/access/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { ServiceIf } from '~/src/shared/service/types.ts';
import { apiNode, NamedNodeData } from '~/src/modules/node/mod.ts';
import { UserAttrs } from '../../types.ts';
import { ApiIf } from '../if.ts';
import { newUid } from './new-uid.ts';

export const makeUser: ApiIf['makeUser'] = async (ctx: ApiContext<ServiceIf>, { name, uid, title, description, passwordId }) => {
  uid = uid || await newUid({ ...ctx, access: ADMIN_ACCESS }, {});

  await apiNode.make(ctx, {
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

  await apiNode.make(ctx, {
    path: `/users/${name}/files`,
    type: 'd',
    props: {
      uid,
      mode: 0o770,
    },
  });

  await apiNode.make(ctx, {
    path: `/users/${name}/groups`,
    type: 'd',
    props: {
      uid,
      mode: 0o770,
    },
  });

  await apiNode.make(ctx, {
    path: `/users/${name}/stars`,
    type: 'd',
    props: {
      uid,
      mode: 0o770,
    },
  });

  return await apiNode.resolveOne(ctx, {
    path: `/users/${name}`,
  }) as NamedNodeData<UserAttrs>;
};

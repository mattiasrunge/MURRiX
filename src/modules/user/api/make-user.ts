import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { NamedNodeData, nodeApi } from '~/src/modules/node/mod.ts';
import { Access, ADMIN_ACCESS } from '~/src/shared/access/mod.ts';
import { PasswordId } from '~/src/modules/user/mod.ts';
import { UserId } from '~/src/shared/mode/mod.ts';
import { UserAttrs } from '../types.ts';
import { newUid } from './new-uid.ts';

type I = {
  access: Access;
  name: string;
  uid?: UserId;
  title?: string;
  description?: string;
  passwordId?: PasswordId;
};

type O = NamedNodeData<UserAttrs>;

export const makeUser = api<I, O>(
  async (service: ServiceIf, { access, name, uid, title, description, passwordId }: I) => {
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
    }) as O;
  },
);

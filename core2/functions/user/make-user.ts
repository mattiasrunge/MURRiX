import { Access, ADMIN_ACCESS, NamedNodeData, UserId, utils } from '~/blocks/nodefs/mod.ts';
import { PasswordId } from '~/blocks/vault/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { node } from '~/functions/node.ts';
import { newUid } from './new-uid.ts';
import { UserAttrs } from './types.ts';

type I = {
  access: Access;
  name: string;
  uid?: UserId;
  title?: string;
  description?: string;
  passwordId?: PasswordId;
};

type O = NamedNodeData<UserAttrs>;

export const makeUser = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, name, uid, title, description, passwordId }: I) => {
    uid = uid || await newUid(api, { access: ADMIN_ACCESS });

    await utils.make<UserAttrs>(api.nodefs, access, `/users/${name}`, 'u', {
      uid,
      title: title || null,
      description: description || null,
      passwordId: passwordId || null,
    }, {
      uid,
      mode: 0o570,
    });

    await utils.make(api.nodefs, access, `/users/${name}/files`, 'd', {}, {
      uid,
      mode: 0o770,
    });

    await utils.make(api.nodefs, access, `/users/${name}/groups`, 'd', {}, {
      uid,
      mode: 0o770,
    });

    await utils.make(api.nodefs, access, `/users/${name}/stars`, 'd', {}, {
      uid,
      mode: 0o770,
    });

    return await node.resolveOne(api, {
      access,
      path: `/users/${name}`,
    }) as O;
  },
);

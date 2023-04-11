import { Access, UserId } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';
import { UserAttrs } from './types.ts';

type I = {
  access: Access;
};

type O = UserId;

export const newUid = wrap<I, O>(
  import.meta.url,
  async (api: API, { access }: I) => {
    const users = await api.nodefs.resolve<UserAttrs>(access, '/users/*');
    const uids = users.map((user) => user.attrs.uid);

    return Math.max(0, ...uids) + 1;
  },
);

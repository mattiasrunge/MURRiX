import { Access, NamedNodeData } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';
import { GroupAttrs } from './types.ts';

type I = {
  access: Access;
  username: string;
};

type O = NamedNodeData<GroupAttrs>[];

export const getGroups = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, username }: I) => {
    return await api.nodefs.resolve<GroupAttrs>(access, `/users/${username}/groups/*`);
  },
);

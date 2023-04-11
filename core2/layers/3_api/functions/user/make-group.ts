import { Access, ADMIN_ACCESS, GroupId, NamedNodeData, utils } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';
import { newGid } from './new-gid.ts';
import { GroupAttrs } from './types.ts';

type I = {
  access: Access;
  name: string;
  gid?: GroupId;
  title?: string;
  description?: string;
};

type O = NamedNodeData<GroupAttrs>;

export const makeGroup = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, name, gid, title, description }: I) => {
    gid = gid || await newGid(api, { access: ADMIN_ACCESS });

    const group = await utils.make<GroupAttrs>(api.nodefs, access, `/groups/${name}`, 'g', {
      gid,
      title: title || null,
      description: description || null,
    });

    await utils.make(api.nodefs, access, `/groups/${name}/users`, 'd', {}, {
      gid,
      mode: 0o770,
    });

    return group;
  },
);

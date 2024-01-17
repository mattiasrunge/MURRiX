import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { NamedNodeData, nodeApi } from '~/src/modules/node/mod.ts';
import { Access, ADMIN_ACCESS } from '~/src/shared/access/mod.ts';
import { GroupId } from '~/src/shared/mode/mod.ts';
import { GroupAttrs } from '../types.ts';
import { newGid } from './new-gid.ts';

type I = {
  access: Access;
  name: string;
  gid?: GroupId;
  title?: string;
  description?: string;
};

type O = NamedNodeData<GroupAttrs>;

export const makeGroup = api<I, O>(
  async (service: ServiceIf, { access, name, gid, title, description }: I) => {
    gid = gid || await newGid(service, { access: ADMIN_ACCESS });

    await nodeApi.make(service, {
      access,
      path: `/groups/${name}`,
      type: 'g',
      attrs: {
        gid,
        title: title || null,
        description: description || null,
      },
    });

    await nodeApi.make(service, {
      access,
      path: `/groups/${name}/users`,
      type: 'd',
      props: {
        gid,
        mode: 0o770,
      },
    });

    return await nodeApi.resolveOne(service, {
      access,
      path: `/groups/${name}`,
    }) as O;
  },
);

import { NamedNodeData, nodeApi } from '~/src/modules/node/mod.ts';
import { ADMIN_ACCESS } from '~/src/shared/access/mod.ts';
import { GroupAttrs } from '../types.ts';
import { newGid } from './new-gid.ts';
import { ApiIf } from '../api.ts';

export const makeGroup: ApiIf['makeGroup'] = async (service, { access, name, gid, title, description }) => {
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
  }) as NamedNodeData<GroupAttrs>;
};

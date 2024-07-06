import { ADMIN_ACCESS } from '~/src/shared/access/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { ServiceIf } from '~/src/shared/service/types.ts';
import { apiNode, NamedNodeData } from '~/src/modules/node/mod.ts';
import { GroupAttrs } from '../../types.ts';
import { ApiIf } from '../if.ts';
import { newGid } from './new-gid.ts';

export const makeGroup: ApiIf['makeGroup'] = async (ctx: ApiContext<ServiceIf>, { name, gid, title, description }) => {
  gid = gid || await newGid({ ...ctx, access: ADMIN_ACCESS }, {});

  await apiNode.make(ctx, {
    path: `/groups/${name}`,
    type: 'g',
    attrs: {
      gid,
      title: title || null,
      description: description || null,
    },
  });

  await apiNode.make(ctx, {
    path: `/groups/${name}/users`,
    type: 'd',
    props: {
      gid,
      mode: 0o770,
    },
  });

  return await apiNode.resolveOne(ctx, {
    path: `/groups/${name}`,
  }) as NamedNodeData<GroupAttrs>;
};

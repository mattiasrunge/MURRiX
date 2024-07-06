import { assert } from '@std/assert';
import { basename } from '@std/path';
import { ApiContext } from '~/src/shared/api/types.ts';
import { ServiceIf } from '~/src/shared/service/types.ts';
import { ADMIN_ACCESS } from '~/src/shared/access/mod.ts';
import { apiNode, NamedNodeData, NodeData } from '~/src/modules/node/mod.ts';
import { UserAttrs } from '../../types.ts';
import { ApiIf } from '../if.ts';

export const whoami: ApiIf['whoami'] = async (ctx: ApiContext<ServiceIf>) => {
  const user = await apiNode.findOne({ ...ctx, access: ADMIN_ACCESS }, {
    query: { 'attrs.uid': ctx.access.uid },
  }) as NodeData<UserAttrs>;

  assert(user, 'invalid uid');

  const paths = await apiNode.resolvePaths(ctx, {
    id: user._id,
  });

  return {
    ...user,
    name: basename(paths[0]),
    paths,
  } as NamedNodeData<UserAttrs>;
};

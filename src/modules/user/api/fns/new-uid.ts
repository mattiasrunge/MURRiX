import { ApiContext } from '~/src/shared/api/types.ts';
import { ServiceIf } from '~/src/shared/service/types.ts';
import { apiNode, NamedNodeData } from '~/src/modules/node/mod.ts';
import { UserAttrs } from '../../types.ts';
import { ApiIf } from '../if.ts';

export const newUid: ApiIf['newUid'] = async (ctx: ApiContext<ServiceIf>) => {
  const users = await apiNode.resolve(ctx, {
    path: '/users/*',
  }) as NamedNodeData<UserAttrs>[];
  const uids = users.map((user) => user.attrs.uid);

  return Math.max(0, ...uids) + 1;
};

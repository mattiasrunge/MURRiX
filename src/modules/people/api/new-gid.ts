import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { NamedNodeData, nodeApi } from '~/src/modules/node/mod.ts';
import { GroupId } from '~/src/shared/mode/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { GroupAttrs } from '../types.ts';

type I = {
  access: Access;
};

type O = GroupId;

export const newGid = api<I, O>(
  async (service: ServiceIf, { access }: I) => {
    const groups = await nodeApi.resolve(service, {
      access,
      path: '/groups/*',
    }) as NamedNodeData<GroupAttrs>[];
    const gids = groups.map((group) => group.attrs.gid);

    return Math.max(0, ...gids) + 1;
  },
);

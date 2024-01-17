import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { NamedNodeData, nodeApi } from '~/src/modules/node/mod.ts';
import { GroupAttrs } from '../types.ts';

type I = {
  access: Access;
  username: string;
};

type O = NamedNodeData<GroupAttrs>[];

export const getGroups = api<I, O>(
  async (service: ServiceIf, { access, username }: I) => {
    return await nodeApi.resolve(service, {
      access,
      path: `/users/${username}/groups/*`,
    }) as O;
  },
);

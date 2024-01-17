import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { Access, GUEST_GROUPNAME, GUEST_USERNAME } from '~/src/shared/access/mod.ts';
import { nodeApi } from '~/src/modules/node/mod.ts';

type I = {
  access: Access;
  group: string;
  user: string;
};

type O = boolean;

export const join = api<I, O>(
  async (service: ServiceIf, { access, group, user }: I) => {
    const nodeGroupId = crypto.randomUUID();

    if (user === GUEST_USERNAME && group !== GUEST_GROUPNAME) {
      throw new Error('guest cannot join any group other than the guest group');
    }

    await nodeApi.softlink(service, {
      access,
      path: `/users/${user}/groups/${group}`,
      targetPath: `/groups/${group}`,
      type: 's',
      props: {
        group: nodeGroupId,
      },
    });

    await nodeApi.softlink(service, {
      access,
      path: `/groups/${group}/users/${user}`,
      targetPath: `/users/${user}`,
      type: 's',
      props: {
        group: nodeGroupId,
      },
    });

    return true;
  },
);

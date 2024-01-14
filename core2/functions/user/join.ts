import { Access, GUEST_GROUPNAME, GUEST_USERNAME } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { node } from '~/functions/node.ts';

type I = {
  access: Access;
  group: string;
  user: string;
};

type O = boolean;

export const join = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, group, user }: I) => {
    const nodeGroupId = crypto.randomUUID();

    if (user === GUEST_USERNAME && group !== GUEST_GROUPNAME) {
      throw new Error('guest cannot join any group other than the guest group');
    }

    await node.softlink(api, {
      access,
      path: `/users/${user}/groups/${group}`,
      targetPath: `/groups/${group}`,
      type: 's',
      props: {
        group: nodeGroupId,
      },
    });

    await node.softlink(api, {
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

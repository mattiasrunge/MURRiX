import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { nodeApi, NodePath } from '~/src/modules/node/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';

type I = {
  access: Access;
  mePath: NodePath;
  partnerPath: NodePath;
};

type O = boolean;

export const setPartner = api<I, O>(
  async (service: ServiceIf, { access, mePath, partnerPath }: I) => {
    try {
      // This is a softlink which is grouped so
      // only one needs to be removed.
      await nodeApi.remove(service, {
        access,
        path: `${mePath}/partner`,
      });
    } catch {
      // Do nothing
    }

    const group = crypto.randomUUID();

    await nodeApi.softlink(service, {
      access,
      path: `${mePath}/partner`,
      targetPath: partnerPath,
      type: 's',
      props: {
        group,
      },
    });

    await nodeApi.softlink(service, {
      access,
      path: `${partnerPath}/partner`,
      targetPath: mePath,
      type: 's',
      props: {
        group,
      },
    });

    return true;
  },
);

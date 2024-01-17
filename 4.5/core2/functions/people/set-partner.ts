import { Access, NodePath } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { node } from '~/functions/node.ts';

type I = {
  access: Access;
  mePath: NodePath;
  partnerPath: NodePath;
};

type O = boolean;

export const setPartner = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, mePath, partnerPath }: I) => {
    try {
      // This is a softlink which is grouped so
      // only one needs to be removed.
      await node.remove(api, {
        access,
        path: `${mePath}/partner`,
      });
    } catch {
      // Do nothing
    }

    const group = crypto.randomUUID();

    await node.softlink(api, {
      access,
      path: `${mePath}/partner`,
      targetPath: partnerPath,
      type: 's',
      props: {
        group,
      },
    });

    await node.softlink(api, {
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

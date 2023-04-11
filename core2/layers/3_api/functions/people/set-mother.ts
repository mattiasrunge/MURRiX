import { Access, NodePath } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';
import * as node from '../node/mod.ts';

type I = {
  access: Access;
  childPath: NodePath;
  motherPath: NodePath;
};

type O = boolean;

export const setMother = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, childPath, motherPath }: I) => {
    try {
      // This is a softlink which is grouped so
      // only one needs to be removed.
      await node.remove(api, {
        access,
        path: `${childPath}/parents/mother`,
      });
    } catch {
      // Do nothing
    }

    const group = crypto.randomUUID();

    await node.softlink(api, {
      access,
      path: `${childPath}/parents/mother`,
      targetPath: motherPath,
      type: 's',
      props: {
        group,
      },
    });

    await node.softlink(api, {
      access,
      path: `${motherPath}/children`,
      targetPath: childPath,
      type: 's',
      props: {
        group,
      },
    });

    return true;
  },
);

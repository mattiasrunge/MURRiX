import { Access, NodePath } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';
import * as node from '../node/mod.ts';

type I = {
  access: Access;
  childPath: NodePath;
  fatherPath: NodePath;
};

type O = boolean;

export const setFather = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, childPath, fatherPath }: I) => {
    try {
      // This is a softlink which is grouped so
      // only one needs to be removed.
      await node.remove(api, {
        access,
        path: `${childPath}/parents/father`,
      });
    } catch {
      // Do nothing
    }

    const group = crypto.randomUUID();

    await node.softlink(api, {
      access,
      path: `${childPath}/parents/father`,
      targetPath: fatherPath,
      type: 's',
      props: {
        group,
      },
    });

    await node.softlink(api, {
      access,
      path: `${fatherPath}/children`,
      targetPath: childPath,
      type: 's',
      props: {
        group,
      },
    });

    return true;
  },
);

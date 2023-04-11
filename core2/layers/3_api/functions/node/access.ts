import { Access, AccessLevel, utils } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';

type I = {
  access: Access;
  path: string;
  level: AccessLevel;
};

type O = boolean;

export const access = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, path, level }: I) => {
    return await utils.access(api.nodefs, access, path, level);
  },
);

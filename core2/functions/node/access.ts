import { Access, AccessLevel, utils } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';

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

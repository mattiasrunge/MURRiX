import { utils } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';

type I = Record<string, never>;

type O = boolean;

export const init = wrap<I, O>(
  import.meta.url,
  async (api: API, {}: I) => {
    await utils.ensureRoot(api.nodefs);

    return true;
  },
);

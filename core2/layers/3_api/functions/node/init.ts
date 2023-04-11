import { utils } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';

type I = Record<string, never>;

type O = boolean;

export const init = wrap<I, O>(
  import.meta.url,
  async (api: API, {}: I) => {
    await utils.ensureRoot(api.nodefs);

    return true;
  },
);

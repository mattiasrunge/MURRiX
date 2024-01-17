import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { collection, nodefs } from '../nodefs/mod.ts';

type I = Record<string, never>;

type O = boolean;

export const init = api<I, O>(
  async (service: ServiceIf, {}: I) => {
    const col = collection(service);
    await nodefs.ensureRoot(col);

    return true;
  },
);

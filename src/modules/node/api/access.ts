import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { Access, AccessLevel } from '~/src/shared/access/mod.ts';
import { collection, nodefs } from '../nodefs/mod.ts';

type I = {
  access: Access;
  path: string;
  level: AccessLevel;
};

type O = boolean;

export const access = api<I, O>(
  async (service: ServiceIf, { access, path, level }: I) => {
    const col = collection(service);
    return await nodefs.hasAccess(col, access, path, level);
  },
);

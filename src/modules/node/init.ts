import { ApiContext } from '~/src/shared/api/types.ts';
import { ServiceIf } from '~/src/shared/service/mod.ts';
import { collection, nodefs } from './nodefs/mod.ts';

export const init = async (ctx: ApiContext<ServiceIf>) => {
  const col = collection(ctx.service);
  await nodefs.ensureRoot(col);

  return true;
};

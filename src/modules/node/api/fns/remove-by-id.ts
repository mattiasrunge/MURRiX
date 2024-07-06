import { ServiceIf } from '~/src/shared/service/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { collection, nodefs } from '../../nodefs/mod.ts';
import { ApiIf } from '../if.ts';

export const removeById: ApiIf['removeById'] = async (ctx: ApiContext<ServiceIf>, { id }) => {
  const col = collection(ctx.service);
  return await nodefs.removeById(col, ctx.access, id);
};

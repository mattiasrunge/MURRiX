import { ServiceIf } from '~/src/shared/service/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { collection, nodefs } from '../../nodefs/mod.ts';
import { ApiIf } from '../if.ts';

export const findOne: ApiIf['findOne'] = async (ctx: ApiContext<ServiceIf>, { query }) => {
  const col = collection(ctx.service);
  return await nodefs.findOne(col, ctx.access, query);
};

import { ServiceIf } from '~/src/shared/service/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { collection, nodefs } from '../../nodefs/mod.ts';
import { ApiIf } from '../if.ts';

export const make: ApiIf['make'] = async (ctx: ApiContext<ServiceIf>, { path, type, attrs, props }) => {
  const col = collection(ctx.service);
  return await nodefs.make(col, ctx.access, path, type, attrs, props);
};

import { ServiceIf } from '~/src/shared/service/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { collection, nodefs } from '../../nodefs/mod.ts';
import { ApiIf } from '../if.ts';

export const group: ApiIf['group'] = async (ctx: ApiContext<ServiceIf>, { path, group }) => {
  const col = collection(ctx.service);
  const { _id } = await nodefs.resolveOne(col, ctx.access, path, {
    readlink: true,
  });

  return await nodefs.setProps(col, ctx.access, _id, { group });
};

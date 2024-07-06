import { assert } from '@std/assert';
import { ServiceIf } from '~/src/shared/service/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { collection, nodefs, PartialNodeProps } from '../../nodefs/mod.ts';
import { ApiIf } from '../if.ts';

export const setOwner: ApiIf['setOwner'] = async (ctx: ApiContext<ServiceIf>, { path, uid, gid, recursive }) => {
  const col = collection(ctx.service);
  const { _id } = await nodefs.resolveOne(col, ctx.access, path, {
    readlink: true,
  });

  const props: PartialNodeProps = {};

  uid && (props.uid = uid);
  gid && (props.gid = gid);

  assert(props.uid || props.gid, 'uid or gid must be provided');

  return await nodefs.setProps(col, ctx.access, _id, props, {
    recursive,
  });
};

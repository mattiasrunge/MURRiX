import { ServiceIf } from '~/src/shared/service/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { collection, NodeACL, nodefs } from '../../nodefs/mod.ts';
import { ApiIf } from '../if.ts';

export const revoke: ApiIf['revoke'] = async (ctx: ApiContext<ServiceIf>, { path, mode, uid, gid, recursive }) => {
  const col = collection(ctx.service);
  const nodeData = await nodefs.resolveOne(col, ctx.access, path, {
    readlink: true,
  });

  const acl: NodeACL[] = nodeData.props.acl.filter((a) => a.gid !== gid || a.uid !== uid || a.mode !== mode);

  return await nodefs.setProps(col, ctx.access, nodeData._id, { acl }, {
    recursive,
  });
};

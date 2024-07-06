import { ServiceIf } from '~/src/shared/service/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { collection, NodeACL, nodefs } from '../../nodefs/mod.ts';
import { ApiIf } from '../if.ts';

export const grant: ApiIf['grant'] = async (ctx: ApiContext<ServiceIf>, { path, mode, uid, gid, recursive }) => {
  const col = collection(ctx.service);
  const nodeData = await nodefs.resolveOne(col, ctx.access, path, {
    readlink: true,
  });

  const acl: NodeACL[] = [
    ...nodeData.props.acl,
    { mode, uid, gid },
  ];

  // Remove duplicates
  const aclHash = Object.fromEntries(acl.map((a) => [JSON.stringify(a), a]));

  return await nodefs.setProps(col, ctx.access, nodeData._id, { acl: Object.values(aclHash) }, {
    recursive,
  });
};

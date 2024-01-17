import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { GroupId, Mode, UserId } from '~/src/shared/mode/mod.ts';
import { collection, NodeACL, NodeData, nodefs, NodePath } from '../nodefs/mod.ts';

type I = {
  access: Access;
  path: NodePath;
  mode: Mode;
  uid?: UserId;
  gid?: GroupId;
  recursive?: boolean;
};

type O = NodeData;

export const grant = api<I, O>(
  async (service: ServiceIf, { access, path, mode, uid, gid, recursive }: I) => {
    const col = collection(service);
    const nodeData = await nodefs.resolveOne(col, access, path, {
      readlink: true,
    });

    const acl: NodeACL[] = [
      ...nodeData.props.acl,
      { mode, uid, gid },
    ];

    // Remove duplicates
    const aclHash = Object.fromEntries(acl.map((a) => [JSON.stringify(a), a]));

    return await nodefs.setProps(col, access, nodeData._id, { acl: Object.values(aclHash) }, {
      recursive,
    });
  },
);

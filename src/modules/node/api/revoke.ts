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

export const revoke = api<I, O>(
  async (service: ServiceIf, { access, path, mode, uid, gid, recursive }: I) => {
    const col = collection(service);
    const nodeData = await nodefs.resolveOne(col, access, path, {
      readlink: true,
    });

    const acl: NodeACL[] = nodeData.props.acl.filter((a) => a.gid !== gid || a.uid !== uid || a.mode !== mode);

    return await nodefs.setProps(col, access, nodeData._id, { acl }, {
      recursive,
    });
  },
);

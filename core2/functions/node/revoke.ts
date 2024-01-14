import { Access, AccessMode, GroupId, NodeACL, NodeData, NodePath, UserId } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { resolveOne } from './resolve-one.ts';

type I = {
  access: Access;
  path: NodePath;
  mode: AccessMode;
  uid?: UserId;
  gid?: GroupId;
  recursive?: boolean;
};

type O = NodeData;

export const revoke = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, path, mode, uid, gid, recursive }: I) => {
    const nodeData = await resolveOne(api, {
      access,
      path,
      options: { readlink: true },
    });

    const acl: NodeACL[] = nodeData.props.acl.filter((a) => a.gid !== gid || a.uid !== uid || a.mode !== mode);

    return await api.nodefs.setProps(access, nodeData._id, { acl }, {
      recursive,
    });
  },
);

import { Access, AccessMode, GroupId, NodeACL, NodeData, NodePath, UserId } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';

type I = {
  access: Access;
  path: NodePath;
  mode: AccessMode;
  uid?: UserId;
  gid?: GroupId;
  recursive?: boolean;
};

type O = NodeData;

export const grant = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, path, mode, uid, gid, recursive }: I) => {
    const nodeData = await api.nodefs.resolveOne(access, path, { readlink: true });

    const acl: NodeACL[] = [
      ...nodeData.props.acl,
      { mode, uid, gid },
    ];

    // Remove duplicates
    const aclHash = Object.fromEntries(acl.map((a) => [JSON.stringify(a), a]));

    return await api.nodefs.setProps(access, nodeData._id, { acl: Object.values(aclHash) }, {
      recursive,
    });
  },
);

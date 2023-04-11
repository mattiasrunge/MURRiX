import { assert } from 'std/_util/asserts.ts';
import { Access, GroupId, NodeData, NodePath, PartialNodeProps, UserId } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';

type I = {
  access: Access;
  path: NodePath;
  uid?: UserId;
  gid?: GroupId;
  recursive?: boolean;
};

type O = NodeData;

export const setOwner = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, path, uid, gid, recursive }: I) => {
    const { _id } = await api.nodefs.resolveOne(access, path, { readlink: true });

    const props: PartialNodeProps = {};

    uid && (props.uid = uid);
    gid && (props.gid = gid);

    assert(props.uid || props.gid, 'uid or gid must be provided');

    return await api.nodefs.setProps(access, _id, props, {
      recursive,
    });
  },
);

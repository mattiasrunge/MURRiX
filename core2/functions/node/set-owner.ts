import { assert } from 'std/_util/asserts.ts';
import { GroupId, UserId } from '~/lib/mode/mod.ts';
import { Access, NodeData, NodePath, PartialNodeProps } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { resolveOne } from './resolve-one.ts';

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
    const { _id } = await resolveOne(api, {
      access,
      path,
      options: { readlink: true },
    });

    const props: PartialNodeProps = {};

    uid && (props.uid = uid);
    gid && (props.gid = gid);

    assert(props.uid || props.gid, 'uid or gid must be provided');

    return await api.nodefs.setProps(access, _id, props, {
      recursive,
    });
  },
);

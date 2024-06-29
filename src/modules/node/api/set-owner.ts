import { assert } from '@std/assert';
import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { GroupId, UserId } from '~/src/shared/mode/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { collection, NodeData, nodefs, NodePath, PartialNodeProps } from '../nodefs/mod.ts';

type I = {
  access: Access;
  path: NodePath;
  uid?: UserId;
  gid?: GroupId;
  recursive?: boolean;
};

type O = NodeData;

export const setOwner = api<I, O>(
  async (service: ServiceIf, { access, path, uid, gid, recursive }: I) => {
    const col = collection(service);
    const { _id } = await nodefs.resolveOne(col, access, path, {
      readlink: true,
    });

    const props: PartialNodeProps = {};

    uid && (props.uid = uid);
    gid && (props.gid = gid);

    assert(props.uid || props.gid, 'uid or gid must be provided');

    return await nodefs.setProps(col, access, _id, props, {
      recursive,
    });
  },
);

import { JSONValue, NullPartial } from '~/src/shared/types.ts';
import { GroupId, Mode, UserId } from '~/src/shared/mode/mod.ts';

export type NodeId = string;
export type NodePath = string;

export type NodeUserTime = {
  uid: UserId;
  timestamp: number;
};

export type NodeACL = {
  mode: Mode;
  uid?: UserId;
  gid?: GroupId;
};

export type NodeChild = {
  id: NodeId;
  name: string;
};

export type NodeFSFile = {
  id: string;
  area: string;
  name: string;
  mimetype: string;
  size: number;
  checksum: string;
  meta?: Record<string, JSONValue>;
};

export type NodeProps = {
  btime: NodeUserTime; // birth
  ptime: NodeUserTime; // prop modified
  atime: NodeUserTime; // attr modified
  mode: Mode;
  uid: UserId;
  gid: GroupId;
  acl: NodeACL[];
  children: NodeChild[];
  count: number;
  files?: NodeFSFile[];
  link?: NodePath;
  group?: string;
};

export type PartialNodeProps = NullPartial<Omit<NodeProps, 'btime' | 'ptime' | 'atime'>>;

export type NodeAttrs = Record<string, JSONValue>;

export type NodeData<T extends NodeAttrs = NodeAttrs> = {
  _id: NodeId;
  type: string;
  props: NodeProps;
  attrs: T;
};

export type NamedNodeData<T extends NodeAttrs = NodeAttrs> = NodeData<T> & {
  name: string;
  paths?: NodePath[];
};

export type NodeParentAndChild<T extends NodeAttrs = NodeAttrs> = {
  childData: NodeData<T> | NamedNodeData<T>;
  parentData: NodeData<T> | NamedNodeData<T>;
};

export type NodeResolveOptions = {
  /**
   * Don't follow any symlinks, treat symlinks as ordinary nodes
   */
  nofollow?: boolean;

  /**
   * If the resolved node is a symlink return that node not the
   * one it points to
   */
  readlink?: boolean;

  /**
   * If wildcard search do case sensitive match
   */
  caseSensitive?: boolean;
};

export type NodeSetPropsOptions = {
  /**
   * Set Properties recursively.
   */
  recursive?: boolean;
};

export type PersistOps = {
  $set?: Record<string, JSONValue>;
  $unset?: Record<string, ''>;
};

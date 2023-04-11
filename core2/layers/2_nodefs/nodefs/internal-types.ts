import { JSONValue } from '~/layers/0_common/mod.ts';
import { Access } from '../access/mod.ts';
import { NamedNodeData, NodeAttrs, NodeData, NodeId, NodeParentAndChild, NodePath, NodeResolveOptions, PartialNodeProps, PasswordId } from './types.ts';

export type Password = {
  _id: PasswordId;
  created: number;
  hash: string;
};

export type PersistOps = {
  $set?: Record<string, JSONValue>;
  $unset?: Record<string, ''>;
};

export type FindReq = {
  access: Access;
  query: Record<string, JSONValue>;
};
export type FindRes<T extends NodeAttrs = NodeAttrs> = NodeData<T>[];

export type FindOneReq = {
  access: Access;
  query: Record<string, JSONValue>;
};
export type FindOneRes<T extends NodeAttrs = NodeAttrs> = NodeData<T>;

export type ResolveReq = {
  access: Access;
  path: NodePath;
  options?: NodeResolveOptions;
};
export type ResolveRes<T extends NodeAttrs = NodeAttrs> = NamedNodeData<T>[];

export type ResolveOneReq = {
  access: Access;
  path: NodePath;
  options?: NodeResolveOptions;
};
export type ResolveOneRes<T extends NodeAttrs = NodeAttrs> = NamedNodeData<T>;

export type ChildrenReq = {
  access: Access;
  id: NodeId;
};
export type ChildrenRes<T extends NodeAttrs = NodeAttrs> = NamedNodeData<T>[];

export type AddChildReq = {
  access: Access;
  parentId: NodeId;
  childId: NodeId;
  childName: string;
};
export type AddChildRes = NodeParentAndChild;

export type RemoveChildReq = {
  access: Access;
  parentId: NodeId;
  childName: string;
};
export type RemoveChildRes = NodeParentAndChild;

export type SetPropsReq = {
  access: Access;
  id: NodeId;
  props: PartialNodeProps;
};
export type SetPropsRes = NodeData;

export type SetAttrsReq = {
  access: Access;
  id: NodeId;
  attrs: NodeAttrs;
};
export type SetAttrsRes = NodeData;

export type ResolvePathsReq = {
  access: Access;
  id: NodeId;
};
export type ResolvePathsRes = string[];

export type PersistReq = {
  id: NodeId;
  ops: PersistOps;
};
export type PersistRes<T extends NodeAttrs = NodeAttrs> = NodeData<T>;

export type RemoveReq = {
  access: Access;
  id: NodeId;
};
export type RemoveRes = boolean;

export type SetPasswordReq = {
  password: string;
};
export type SetPasswordRes = PasswordId;

export type UnsetPasswordReq = {
  id: PasswordId;
};
export type UnsetPasswordRes = boolean;

export type VerifyPasswordReq = {
  id: PasswordId;
  password: string;
};
export type VerifyPasswordRes = boolean;

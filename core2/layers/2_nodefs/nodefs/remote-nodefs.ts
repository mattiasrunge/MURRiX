import { JSONValue } from '~/layers/0_common/types.ts';
import { LightPhysical } from '~/layers/1_physical/mod.ts';
import { Access } from '../access/mod.ts';
import {
  AddChildReq,
  AddChildRes,
  ChildrenReq,
  ChildrenRes,
  FindOneReq,
  FindOneRes,
  FindReq,
  FindRes,
  PersistOps,
  PersistReq,
  PersistRes,
  RemoveChildReq,
  RemoveChildRes,
  RemoveReq,
  RemoveRes,
  ResolveOneReq,
  ResolveOneRes,
  ResolvePathsReq,
  ResolvePathsRes,
  ResolveReq,
  ResolveRes,
  SetAttrsReq,
  SetAttrsRes,
  SetPasswordReq,
  SetPasswordRes,
  SetPropsReq,
  SetPropsRes,
  UnsetPasswordReq,
  UnsetPasswordRes,
  VerifyPasswordReq,
  VerifyPasswordRes,
} from './internal-types.ts';
import { NodeFS } from './nodefs.ts';
import { NamedNodeData, NodeAttrs, NodeData, NodeId, NodeParentAndChild, NodePath, NodeResolveOptions, PartialNodeProps, PasswordId } from './types.ts';

const TIMEOUT = 1000 * 60 * 3; // 3 minutes

export class RemoteNodeFS extends NodeFS {
  public phy: LightPhysical;

  protected constructor(phy: LightPhysical) {
    super();

    this.phy = phy;
  }

  static async create(phy: LightPhysical) {
    return new RemoteNodeFS(phy);
  }

  async destroy() {}

  find<T extends NodeAttrs>(access: Access, query: Record<string, JSONValue>): Promise<NodeData<T>[]> {
    return this.phy.mq.request<FindReq, FindRes<T>>(
      'nodefs.find',
      { access, query },
      TIMEOUT,
    );
  }

  findOne<T extends NodeAttrs>(access: Access, query: Record<string, JSONValue>): Promise<NodeData<T>> {
    return this.phy.mq.request<FindOneReq, FindOneRes<T>>(
      'nodefs.findOne',
      { access, query },
      TIMEOUT,
    );
  }

  resolve<T extends NodeAttrs = NodeAttrs>(access: Access, path: NodePath, options?: NodeResolveOptions): Promise<NamedNodeData<T>[]> {
    return this.phy.mq.request<ResolveReq, ResolveRes<T>>(
      'nodefs.resolve',
      { access, path, options },
      TIMEOUT,
    );
  }

  resolveOne<T extends NodeAttrs>(access: Access, path: NodePath, options?: NodeResolveOptions): Promise<NamedNodeData<T>> {
    return this.phy.mq.request<ResolveOneReq, ResolveOneRes<T>>(
      'nodefs.resolveOne',
      { access, path, options },
      TIMEOUT,
    );
  }

  children<T extends NodeAttrs = NodeAttrs>(access: Access, id: NodeId): Promise<NamedNodeData<T>[]> {
    return this.phy.mq.request<ChildrenReq, ChildrenRes<T>>(
      'nodefs.children',
      { access, id },
      TIMEOUT,
    );
  }

  addChild(access: Access, parentId: NodeId, childId: NodeId, childName: string): Promise<NodeParentAndChild> {
    return this.phy.mq.request<AddChildReq, AddChildRes>(
      'nodefs.addChild',
      { access, parentId, childId, childName },
      TIMEOUT,
    );
  }

  removeChild(access: Access, parentId: NodeId, childName: string): Promise<NodeParentAndChild> {
    return this.phy.mq.request<RemoveChildReq, RemoveChildRes>(
      'nodefs.removeChild',
      { access, parentId, childName },
      TIMEOUT,
    );
  }

  setProps(access: Access, id: NodeId, props: PartialNodeProps): Promise<NodeData> {
    return this.phy.mq.request<SetPropsReq, SetPropsRes>(
      'nodefs.setProps',
      { access, id, props },
      TIMEOUT,
    );
  }

  setAttrs(access: Access, id: NodeId, attrs: NodeAttrs): Promise<NodeData> {
    return this.phy.mq.request<SetAttrsReq, SetAttrsRes>(
      'nodefs.setAttrs',
      { access, id, attrs },
      TIMEOUT,
    );
  }

  resolvePaths(access: Access, id: NodeId): Promise<NodePath[]> {
    return this.phy.mq.request<ResolvePathsReq, ResolvePathsRes>(
      'nodefs.resolvePaths',
      { access, id },
      TIMEOUT,
    );
  }

  persist<T extends NodeAttrs = NodeAttrs>(id: NodeId, ops: PersistOps) {
    return this.phy.mq.request<PersistReq, PersistRes<T>>(
      'nodefs.persist',
      { id, ops },
      TIMEOUT,
    );
  }

  remove(access: Access, id: NodeId) {
    return this.phy.mq.request<RemoveReq, RemoveRes>(
      'nodefs.remove',
      { access, id },
      TIMEOUT,
    );
  }

  setPassword(password: string) {
    return this.phy.mq.request<SetPasswordReq, SetPasswordRes>(
      'nodefs.setPassword',
      { password },
      TIMEOUT,
    );
  }

  unsetPassword(id: PasswordId) {
    return this.phy.mq.request<UnsetPasswordReq, UnsetPasswordRes>(
      'nodefs.unsetPassword',
      { id },
      TIMEOUT,
    );
  }

  verifyPassword(id: PasswordId, password: string) {
    return this.phy.mq.request<VerifyPasswordReq, VerifyPasswordRes>(
      'nodefs.verifyPassword',
      { id, password },
      TIMEOUT,
    );
  }
}

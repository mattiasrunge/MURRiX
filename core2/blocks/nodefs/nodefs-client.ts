import { JSONValue } from '~/lib/types.ts';
import { MQ } from '~/external/mq/mod.ts';
import { Access } from './access/mod.ts';
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
  SetPropsReq,
  SetPropsRes,
} from './internal-types.ts';
import { NodeFS } from './nodefs.ts';
import { NamedNodeData, NodeAttrs, NodeData, NodeId, NodeParentAndChild, NodePath, NodeResolveOptions, NodeSetPropsOptions, PartialNodeProps } from './types.ts';

const TIMEOUT = 1000 * 60 * 3; // 3 minutes

export class NodeFSClient extends NodeFS {
  public mq: MQ;

  protected constructor(mq: MQ) {
    super();

    this.mq = mq;
  }

  static async create(mq: MQ) {
    return new NodeFSClient(mq);
  }

  async destroy() {}

  find<T extends NodeAttrs>(access: Access, query: Record<string, JSONValue>): Promise<NodeData<T>[]> {
    return this.mq.request<FindReq, FindRes<T>>(
      'nodefs.find',
      { access, query },
      TIMEOUT,
    );
  }

  findOne<T extends NodeAttrs>(access: Access, query: Record<string, JSONValue>): Promise<NodeData<T>> {
    return this.mq.request<FindOneReq, FindOneRes<T>>(
      'nodefs.findOne',
      { access, query },
      TIMEOUT,
    );
  }

  resolve<T extends NodeAttrs = NodeAttrs>(access: Access, path: NodePath, options?: NodeResolveOptions): Promise<NamedNodeData<T>[]> {
    return this.mq.request<ResolveReq, ResolveRes<T>>(
      'nodefs.resolve',
      { access, path, options },
      TIMEOUT,
    );
  }

  resolveOne<T extends NodeAttrs>(access: Access, path: NodePath, options?: NodeResolveOptions): Promise<NamedNodeData<T>> {
    return this.mq.request<ResolveOneReq, ResolveOneRes<T>>(
      'nodefs.resolveOne',
      { access, path, options },
      TIMEOUT,
    );
  }

  children<T extends NodeAttrs = NodeAttrs>(access: Access, id: NodeId, options?: NodeResolveOptions): Promise<NamedNodeData<T>[]> {
    return this.mq.request<ChildrenReq, ChildrenRes<T>>(
      'nodefs.children',
      { access, id, options },
      TIMEOUT,
    );
  }

  addChild(access: Access, parentId: NodeId, childId: NodeId, childName: string): Promise<NodeParentAndChild> {
    return this.mq.request<AddChildReq, AddChildRes>(
      'nodefs.addChild',
      { access, parentId, childId, childName },
      TIMEOUT,
    );
  }

  removeChild(access: Access, parentId: NodeId, childName: string): Promise<NodeParentAndChild> {
    return this.mq.request<RemoveChildReq, RemoveChildRes>(
      'nodefs.removeChild',
      { access, parentId, childName },
      TIMEOUT,
    );
  }

  setProps(access: Access, id: NodeId, props: PartialNodeProps, options?: NodeSetPropsOptions): Promise<NodeData> {
    return this.mq.request<SetPropsReq, SetPropsRes>(
      'nodefs.setProps',
      { access, id, props, options },
      TIMEOUT,
    );
  }

  setAttrs(access: Access, id: NodeId, attrs: NodeAttrs): Promise<NodeData> {
    return this.mq.request<SetAttrsReq, SetAttrsRes>(
      'nodefs.setAttrs',
      { access, id, attrs },
      TIMEOUT,
    );
  }

  resolvePaths(access: Access, id: NodeId): Promise<NodePath[]> {
    return this.mq.request<ResolvePathsReq, ResolvePathsRes>(
      'nodefs.resolvePaths',
      { access, id },
      TIMEOUT,
    );
  }

  persist<T extends NodeAttrs = NodeAttrs>(id: NodeId, ops: PersistOps) {
    return this.mq.request<PersistReq, PersistRes<T>>(
      'nodefs.persist',
      { id, ops },
      TIMEOUT,
    );
  }

  remove(access: Access, id: NodeId) {
    return this.mq.request<RemoveReq, RemoveRes>(
      'nodefs.remove',
      { access, id },
      TIMEOUT,
    );
  }
}

import * as scrypt from 'scrypt';
import { JSONValue } from '~/layers/0_common/types.ts';
import { FullPhysical } from '~/layers/1_physical/mod.ts';
import { Access } from '../access/mod.ts';
import { getPaths } from './paths.ts';
import { NodeAttrs, NodeData, NodeId, NodePath, PasswordId } from './types.ts';
import {
  AddChildReq,
  AddChildRes,
  ChildrenReq,
  ChildrenRes,
  FindOneReq,
  FindOneRes,
  FindReq,
  FindRes,
  Password,
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

export class LocalNodeFS extends NodeFS {
  public phy: FullPhysical;

  protected constructor(phy: FullPhysical) {
    super();

    this.phy = phy;
  }

  static async create(phy: FullPhysical) {
    const nodefs = new LocalNodeFS(phy);

    const collection = phy.db.collection<NodeData>('nodes');
    collection.createIndexes({
      indexes: [
        'type',
        'props.btime.timestamp',
        'props.children.name',
        'props.children.id',
        'props.link',
      ].map((name) => ({
        key: { [name]: 1 },
        name: name.replaceAll('.', '_'),
      })),
    });

    await phy.mq.requestHandler<FindReq, FindRes>(
      'nodefs.find',
      ({ access, query }) => nodefs.find(access, query),
    );

    await phy.mq.requestHandler<FindOneReq, FindOneRes>(
      'nodefs.findOne',
      ({ access, query }) => nodefs.findOne(access, query),
    );

    await phy.mq.requestHandler<ResolveReq, ResolveRes>(
      'nodefs.resolve',
      ({ access, path, options }) => nodefs.resolve(access, path, options),
    );

    await phy.mq.requestHandler<ResolveOneReq, ResolveOneRes>(
      'nodefs.resolveOne',
      ({ access, path, options }) => nodefs.resolveOne(access, path, options),
    );

    await phy.mq.requestHandler<ChildrenReq, ChildrenRes>(
      'nodefs.children',
      ({ access, id }) => nodefs.children(access, id),
    );

    await phy.mq.requestHandler<AddChildReq, AddChildRes>(
      'nodefs.addChild',
      ({ access, parentId, childId, childName }) => nodefs.addChild(access, parentId, childId, childName),
    );

    await phy.mq.requestHandler<RemoveChildReq, RemoveChildRes>(
      'nodefs.removeChild',
      ({ access, parentId, childName }) => nodefs.removeChild(access, parentId, childName),
    );

    await phy.mq.requestHandler<SetPropsReq, SetPropsRes>(
      'nodefs.setProps',
      ({ access, id, props }) => nodefs.setProps(access, id, props),
    );

    await phy.mq.requestHandler<SetAttrsReq, SetAttrsRes>(
      'nodefs.setAttrs',
      ({ access, id, attrs }) => nodefs.setAttrs(access, id, attrs),
    );

    await phy.mq.requestHandler<ResolvePathsReq, ResolvePathsRes>(
      'nodefs.resolvePaths',
      ({ access, id }) => nodefs.resolvePaths(access, id),
    );

    await phy.mq.requestHandler<PersistReq, PersistRes>(
      'nodefs.persist',
      ({ id, ops }) => nodefs.persist(id, ops),
    );

    await phy.mq.requestHandler<RemoveReq, RemoveRes>(
      'nodefs.remove',
      ({ access, id }) => nodefs.remove(access, id),
    );

    await phy.mq.requestHandler<SetPasswordReq, SetPasswordRes>(
      'nodefs.setPassword',
      ({ password }) => nodefs.setPassword(password),
    );

    await phy.mq.requestHandler<UnsetPasswordReq, UnsetPasswordRes>(
      'nodefs.unsetPassword',
      ({ id }) => nodefs.unsetPassword(id),
    );

    await phy.mq.requestHandler<VerifyPasswordReq, VerifyPasswordRes>(
      'nodefs.verifyPassword',
      ({ id, password }) => nodefs.verifyPassword(id, password),
    );

    return nodefs;
  }

  async destroy() {}

  async find<T extends NodeAttrs>(access: Access, query: Record<string, JSONValue>): Promise<NodeData<T>[]> {
    const collection = this.phy.db.collection<NodeData>('nodes');
    const cursor = await collection.find(query);
    const nodeDataList = await cursor.toArray();

    return nodeDataList
      .filter((nodeData) => this.verifyAccess(access, nodeData, 'r'))
      .map((nodeData) => ({
        ...nodeData,
        attrs: nodeData.attrs as T,
      }));
  }

  async findOne<T extends NodeAttrs>(access: Access, query: Record<string, JSONValue>): Promise<NodeData<T>> {
    const collection = this.phy.db.collection<NodeData>('nodes');

    const nodeData = await collection.findOne(query);

    if (!nodeData) {
      throw new Error('no matching node found');
    }

    this.assertAcccess(access, nodeData, 'r');

    return {
      ...nodeData,
      attrs: nodeData.attrs as T,
    };
  }

  async resolvePaths(access: Access, id: NodeId): Promise<NodePath[]> {
    return getPaths(this, access, id);
  }

  async persist<T extends NodeAttrs = NodeAttrs>(id: NodeId, ops: PersistOps) {
    if (ops.$set && Object.keys(ops.$set).length === 0) {
      delete ops.$set;
    }

    if (ops.$unset && Object.keys(ops.$unset).length === 0) {
      delete ops.$unset;
    }

    const collection = this.phy.db.collection<NodeData<T>>('nodes');
    const doc = await collection.findAndModify({ _id: id }, {
      update: ops,
      upsert: true,
      new: true,
    });

    return doc!;
  }

  private async removeRecursive(access: Access, id: NodeId, group?: string) {
    const children = await this.children(access, id, {
      nofollow: true,
    });

    for (const child of children) {
      const { childData } = await this.removeChild(access, id, child.name);

      if (childData.props.count === 0) {
        await this.removeRecursive(access, child._id, childData.props.group);
      }
    }

    const collection = this.phy.db.collection<NodeData>('nodes');
    await collection.deleteOne({ _id: id });

    if (group) {
      try {
        const nodeData = await this.findOne(access, { 'props.group': group });

        await this.assertAccessRecursive(access, nodeData, 'w');
        await this.removeRecursive(access, nodeData._id, group);
      } catch {
        // Do nothing, this is not a fatal error
      }
    }
  }

  async remove(access: Access, id: NodeId) {
    const nodeData = await this.findOne(access, { _id: id });

    if (nodeData.props.count > 0) {
      throw new Error('cannot remove node still attached to other nodes');
    }

    await this.assertAccessRecursive(access, nodeData, 'w');
    await this.removeRecursive(access, id, nodeData.props.group);

    return true;
  }

  async setPassword(password: string) {
    const id = crypto.randomUUID();
    const collection = this.phy.db.collection<Password>('passwords');

    await collection.updateOne({ _id: id }, {
      $set: {
        created: Date.now(),
        hash: await scrypt.hash(password),
      },
    }, { upsert: true });

    return id;
  }

  async unsetPassword(id: PasswordId) {
    const collection = this.phy.db.collection<Password>('passwords');

    await collection.deleteOne({ _id: id });

    return true;
  }

  async verifyPassword(id: PasswordId, password: string) {
    const collection = this.phy.db.collection<Password>('passwords');

    const p = await collection.findOne({ _id: id });

    if (!p) {
      throw new Error('invalid id');
    }

    return scrypt.verify(password, p.hash);
  }
}

import { JSONValue } from '~/lib/types.ts';
import { DB } from '~/external/db/mod.ts';
import { Access } from './access/mod.ts';
import { getPaths } from './paths.ts';
import { PersistOps } from './internal-types.ts';
import { NodeFS } from './nodefs.ts';
import { NodeAttrs, NodeData, NodeId, NodePath } from './types.ts';

export class NodeFSDB extends NodeFS {
  public db: DB;

  protected constructor(db: DB) {
    super();

    this.db = db;
  }

  static async create(db: DB) {
    const nodefs = new NodeFSDB(db);

    const collection = db.collection<NodeData>('nodes');
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

    return nodefs;
  }

  async destroy() {}

  async find<T extends NodeAttrs>(access: Access, query: Record<string, JSONValue>): Promise<NodeData<T>[]> {
    const collection = this.db.collection<NodeData>('nodes');
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
    const collection = this.db.collection<NodeData>('nodes');

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

    const collection = this.db.collection<NodeData<T>>('nodes');
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

    const collection = this.db.collection<NodeData>('nodes');
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
}

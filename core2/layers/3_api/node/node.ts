import { JSONValue } from '~/layers/0_common/types.ts';
import { SharedData } from '~/layers/1_physical/mod.ts';
import { Access, AccessLevel, Node, NodeData, NodeId, NodeProps, NodeType, NodeWithMeta, PartialNodeProps } from './types.ts';
import { NodeFS } from '../nodefs/nodefs.ts';
import { ADMIN_ACCESS, DEFAULT_UMASK } from '../constants.ts';
import { verifyAccess } from '../utils/mod.ts';

export abstract class NodeBase<T extends Record<string, JSONValue>> {
  abstract readonly type: NodeType;
  protected nodefs: NodeFS;
  readonly id: NodeId;
  private sharedData: SharedData<NodeData> | null = null;
  private localData: NodeData | null = null;

  constructor(nodefs: NodeFS, id: NodeId) {
    this.nodefs = nodefs;
    this.id = id;
  }

  async get(_access: Access, _nofollow?: boolean): Promise<Node | null> {
    return this;
  }

  async loadShared() {
    if (this.sharedData) {
      throw new Error('Node already loaded as shared');
    }

    this.sharedData = await SharedData.load<NodeData>(this.nodefs.phy, this, this.id);
    this.localData = null;
  }

  async share() {
    if (this.sharedData) {
      return;
    }

    if (!this.localData) {
      throw new Error('No local data found');
    }

    this.sharedData = await SharedData.create<NodeData>(this.nodefs.phy, this, this.id, this.localData!);
    this.localData = null;
  }

  async persist(access: Access) {
    await this.nodefs.persist(access, await this.data());
  }

  async setProps(access: Access, props: PartialNodeProps) {
    const currentProps = await this.props();

    if (!verifyAccess(currentProps, access, 'w')) {
      throw new Error('Permission denied');
    }

    const newProps = {
      ...currentProps,
      ...props,
      ptime: {
        uid: access.uid,
        timestamp: Date.now(),
      },
    };

    if (this.sharedData) {
      await this.sharedData.set(newProps, 'props');
    } else if (this.localData) {
      this.localData.props = newProps;
    } else {
      throw new Error('No shared or local data found');
    }

    await this.persist(access);
  }

  async props(): Promise<NodeProps> {
    if (this.sharedData) {
      return await this.sharedData.get<NodeProps>('props');
    } else if (this.localData) {
      return this.localData.props;
    }

    throw new Error('No shared or local data found');
  }

  async setAttrs(access: Access, attrs: T) {
    const currentProps = await this.props();
    const currentAttrs = await this.attrs();

    if (!verifyAccess(currentProps, access, 'w')) {
      throw new Error('Permission denied');
    }

    const newAttrs: T = {
      ...currentAttrs,
      ...attrs,
    };

    const newProps = {
      ...currentProps,
      atime: {
        uid: access.uid,
        timestamp: Date.now(),
      },
    };

    if (this.sharedData) {
      await this.sharedData.set(newAttrs, 'attrs');
      await this.setProps(access, newProps);
    } else if (this.localData) {
      this.localData.attrs = newAttrs;
    } else {
      throw new Error('No shared or local data found');
    }

    await this.persist(access);
  }

  async attrs(): Promise<T> {
    if (this.sharedData) {
      return await this.sharedData.get<T>('attrs');
    } else if (this.localData) {
      return this.localData.attrs as T;
    }

    throw new Error('No shared or local data found');
  }

  async setData(data: NodeData) {
    if (this.sharedData) {
      return await this.sharedData.set(data);
    }

    return this.localData = data;
  }

  async initialize(access: Access, data?: { props?: PartialNodeProps; attrs?: T }) {
    const timestamp = Date.now();
    this.localData = {
      _id: this.id,
      type: this.type,
      props: {
        btime: {
          uid: access.uid,
          timestamp,
        },
        ptime: {
          uid: access.uid,
          timestamp,
        },
        atime: {
          uid: access.uid,
          timestamp,
        },
        mode: access.umask || DEFAULT_UMASK,
        uid: access.uid,
        gid: access.gids[0],
        acl: [],
        children: [],
        count: 0,
        files: [],
        ...(data?.props || {}),
      },
      attrs: data?.attrs || {},
    };
  }

  async addChild(access: Access, child: Node, name: string) {
    const childProps = await child.props();
    const props = await this.props();

    if (
      !verifyAccess(childProps, access, 'w') ||
      !verifyAccess(props, access, 'w')
    ) {
      throw new Error('Permission denied');
    }

    if (props.children.some((c) => c.name === name)) {
      throw new Error(`${name} is already used, please choose another name`);
    }

    await child.setProps(access, {
      count: childProps.count + 1,
    });

    await this.setProps(access, {
      children: [
        ...props.children,
        {
          id: child.id,
          name,
        },
      ],
    });
  }

  async removeChild(access: Access, child: Node, name: string) {
    const childProps = await child.props();
    const props = await this.props();

    if (
      !verifyAccess(childProps, access, 'w') ||
      !verifyAccess(props, access, 'w')
    ) {
      throw new Error('Permission denied');
    }

    const index = props.children.findIndex((c) => c.name === name && c.id === child.id);

    if (index === -1) {
      throw new Error(`${name} is not a child on this node`);
    }

    await child.setProps(access, {
      count: childProps.count - 1,
    });

    const children = props.children.slice(0);
    children.splice(index, 1);

    await this.setProps(access, {
      children,
    });
  }

  async children(access: Access): Promise<NodeWithMeta[]> {
    const props = await this.props();
    const ids = props.children.map(({ id }) => id);
    const names = Object.fromEntries(props.children.map(({ id, name }) => [id, name]));
    const query = { _id: { $in: ids } };
    const nodes = await this.nodefs.find(access, query, { nofollow: true });

    return nodes.map((node) => ({
      node,
      name: names[node.id],
    }));
  }

  async remove(access: Access) {
    // TODO: Move the bulk of this code to nodefs
    await this.assertAccess(access, 'w');

    const props = await this.props();

    if (props.count > 0) {
      throw new Error('Cannot remove node still attached to other nodes');
    }

    const recursiveChildrenFlat = async (node: Node) => {
      const list: Node[] = [];
      const children = await node.children(ADMIN_ACCESS);

      for (const { node: child } of children) {
        list.push(child);
        list.push(...(await recursiveChildrenFlat(child)));
      }

      return list;
    };

    const allChildren = await recursiveChildrenFlat(this);

    // TODO: We should probably lock these child nodes so
    // that they cannot be modified while we are removing them

    await Promise.all(
      allChildren.map((child) => child.assertAccess(access, 'w')),
    );

    const children = await this.children(access);

    for (const child of children) {
      await this.removeChild(access, child.node, child.name);
      const childProps = await child.node.props();

      if (childProps.count === 0) {
        await child.node.remove(access);
      }
    }

    await this.nodefs.remove(access, this.id);
  }

  async data(): Promise<NodeData & { attrs: T }> {
    if (this.sharedData) {
      return await this.sharedData.get<NodeData & { attrs: T }>();
    } else if (this.localData) {
      return this.localData as NodeData & { attrs: T };
    }

    throw new Error('No shared or local data found');
  }

  async assertAccess(access: Access, level: AccessLevel) {
    const props = await this.props();
    if (!verifyAccess(props, access, level)) {
      throw new Error('Permission denied');
    }
  }

  async create(access: Access, data?: { props?: PartialNodeProps; attrs?: T }) {
    await this.initialize(access, data);
    await this.persist(access);
  }
}

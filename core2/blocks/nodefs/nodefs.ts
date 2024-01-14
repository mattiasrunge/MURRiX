import { assert } from 'std/_util/asserts.ts';
import { basename, dirname, join, normalize } from 'std/path/mod.ts';
import { JSONValue } from '~/lib/types.ts';
import { checkMode, MaskACL, MaskGroup, MaskOther, MaskOwner } from '~/lib/mode/mod.ts';
import { Access, AccessLevel, ADMIN_ACCESS } from './access/mod.ts';
import { NamedNodeData, NodeAttrs, NodeData, NodeId, NodeParentAndChild, NodePath, NodeResolveOptions, NodeSetPropsOptions, PartialNodeProps } from './types.ts';
import { PersistOps } from './internal-types.ts';

export abstract class NodeFS {
  abstract destroy(): Promise<void>;

  /**
   * @description Find node data based on query and filter on read access.
   */
  public abstract find<T extends NodeAttrs>(access: Access, query: Record<string, JSONValue>): Promise<NodeData<T>[]>;

  /**
   * @description Find one piece of node data based on a query, throw error if
   * nothing found or no read permissions.
   */
  public abstract findOne<T extends NodeAttrs>(access: Access, query: Record<string, JSONValue>): Promise<NodeData<T>>;

  /**
   * @description Given a node path return a list of nodes, if an absolute path return a list
   * with just that node, if wildcard given return list of matching nodes.
   */
  public async resolve<T extends NodeAttrs>(access: Access, path: NodePath, options?: NodeResolveOptions): Promise<NamedNodeData<T>[]> {
    assert(path.startsWith('/'), 'path must start with /');

    const normalPath = normalize(path).replace(/\/$/g, '');
    const name = basename(normalPath);
    const pattern = name.includes('*') ? name.replaceAll('*', '.*?') : false;
    const basePath = pattern ? dirname(normalPath) : normalPath;

    const namedNodeData = await this.resolveOne<T>(access, basePath, options);

    if (pattern) {
      const children = await this.children<T>(access, namedNodeData._id, options);
      const expr = new RegExp(`^${pattern}$`, options?.caseSensitive ? '' : 'i');

      return children
        .filter(({ name }) => expr.test(name))
        .map((child) => ({
          ...child,
          paths: [
            join(basePath, child.name),
          ],
        }));
    }

    return [namedNodeData];
  }

  /**
   * @description Given a node path returns on node data with name and path, throws if nothing found, not readable
   * or if execution access is not granted for parent nodes.
   */
  public async resolveOne<T extends NodeAttrs>(access: Access, path: NodePath, options?: NodeResolveOptions): Promise<NamedNodeData<T>> {
    assert(path.startsWith('/'), 'path must start with /');

    const pathParts = normalize(path).replace(/^\/|\/$/g, '').split('/').filter(Boolean);

    let currentpath = '/';
    let nodeData = await this.findOne<T>(ADMIN_ACCESS, { type: 'r' });
    while (pathParts.length > 0) {
      this.assertAcccess(access, nodeData, 'x');

      const name = pathParts.shift() as string;
      const child = nodeData.props.children.find((c) => c.name === name);

      assert(child, `${path}: path not found`);

      currentpath = join(currentpath, name);
      nodeData = await this.findOne<T>(ADMIN_ACCESS, { _id: child.id });

      if (nodeData.props.link && !(options?.nofollow || (options?.readlink && pathParts.length === 0))) {
        nodeData = await this.resolveOne<T>(ADMIN_ACCESS, nodeData.props.link);
        assert(nodeData, `link in path did not resolve to accessible node`);
      }
    }

    this.assertAcccess(access, nodeData, 'r');

    return {
      ...nodeData,
      name: basename(currentpath),
      paths: [currentpath],
    };
  }

  /**
   * @description Get the children of a node.
   */
  async children<T extends NodeAttrs>(access: Access, id: NodeId, options?: NodeResolveOptions): Promise<NamedNodeData<T>[]> {
    const nodeData = await this.findOne(access, { _id: id });
    const children = nodeData.props.children;
    const query = { _id: { $in: children.map(({ id }) => id) } };
    const nodeDataList = await this.find(access, query);

    return await Promise.all(
      nodeDataList.map(async (nodeData) => {
        // Name should be saved before we resolve a possible link
        // so we actually has a name corresponding to the id.
        const name = children.find((c) => c.id === nodeData._id)!.name;

        if (nodeData.props.link && !(options?.nofollow || options?.readlink)) {
          const linkNodeData = await this.resolveOne(access, nodeData.props.link);

          if (linkNodeData) {
            nodeData = linkNodeData;
          }
        }

        return {
          ...nodeData,
          attrs: nodeData.attrs as T,
          name,
        };
      }),
    );
  }

  /**
   * @description Add a child to a parent node.
   */
  async addChild(access: Access, parentId: NodeId, childId: NodeId, childName: string): Promise<NodeParentAndChild> {
    this.assertNameValid(childName);

    const [
      pNodeData,
      cNodeData,
    ] = await Promise.all([
      this.findOne(access, { _id: parentId }),
      this.findOne(access, { _id: childId }),
    ]);

    this.assertAcccess(access, cNodeData, 'w');
    this.assertAcccess(access, pNodeData, 'w');

    if (pNodeData.props.children.some((c) => c.name === childName)) {
      throw new Error('name already taken');
    }

    // TODO: If we fail in one of these setProps but the other successed we will
    // have inconsistent data. We should probably use a transaction here.

    const [
      childData,
      parentData,
    ] = await Promise.all([
      this.setProps(access, cNodeData._id, {
        count: cNodeData.props.count + 1,
      }),
      this.setProps(access, pNodeData._id, {
        children: [
          ...pNodeData.props.children,
          {
            id: cNodeData._id,
            name: childName,
          },
        ],
      }),
    ]);

    return {
      childData,
      parentData,
    };
  }

  /**
   * @description Remove a child from a parent node.
   */
  async removeChild(access: Access, parentId: NodeId, childName: string): Promise<NodeParentAndChild> {
    const pNodeData = await this.findOne(access, { _id: parentId });

    this.assertAcccess(access, pNodeData, 'w');

    const children = pNodeData.props.children.slice(0);
    const child = children.find(({ name }) => name === childName);

    if (!child) {
      throw new Error('not a child on this node');
    }

    const cNodeData = await this.findOne(access, { _id: child.id });

    this.assertAcccess(access, cNodeData, 'w');

    const [
      childData,
      parentData,
    ] = await Promise.all([
      this.setProps(access, cNodeData._id, {
        count: cNodeData.props.count - 1,
      }),

      this.setProps(access, pNodeData._id, {
        children: children.filter((c) => c !== child),
      }),
    ]);

    return {
      childData,
      parentData,
    };
  }

  /**
   * @description Set the properties of a node.
   */
  async setProps(access: Access, id: NodeId, props: PartialNodeProps, options?: NodeSetPropsOptions): Promise<NodeData> {
    const nodeData = await this.findOne(access, { _id: id });

    this.assertAcccess(access, nodeData, 'w');

    const ops: PersistOps = {
      $set: {},
      $unset: {},
    };
    ops.$set!['props.ptime'] = {
      uid: access.uid,
      timestamp: Date.now(),
    };

    for (const [key, value] of Object.entries(props)) {
      if (value === null) {
        ops.$unset![`props.${key}`] = '';
      } else {
        ops.$set![`props.${key}`] = value;
      }
    }

    const newNodeData = await this.persist(id, ops);

    if (options?.recursive) {
      for (const { id } of nodeData.props.children) {
        await this.setProps(access, id, props, options);
      }
    }

    return newNodeData;
  }

  /**
   * @description Set the attributes of a node.
   */
  async setAttrs(access: Access, id: NodeId, attrs: NodeAttrs): Promise<NodeData> {
    const nodeData = await this.findOne(access, { _id: id });

    this.assertAcccess(access, nodeData, 'w');

    const timestamp = Date.now();
    const ops: PersistOps = {
      $set: {},
      $unset: {},
    };
    ops.$set!['props.atime'] = {
      uid: access.uid,
      timestamp,
    };
    ops.$set!['props.ptime'] = {
      uid: access.uid,
      timestamp,
    };

    for (const [key, value] of Object.entries(attrs)) {
      if (value === null) {
        ops.$unset![`attrs.${key}`] = '';
      } else {
        ops.$set![`attrs.${key}`] = value;
      }
    }

    return await this.persist(id, ops);
  }

  /**
   * @description Assert that access has the required level for the node.
   */
  assertAcccess(access: Access, nodeData: NodeData, level: AccessLevel) {
    if (!this.verifyAccess(access, nodeData, level)) {
      throw new Error('permission denied');
    }
  }

  /**
   * @description Verify that the access has the required level for the node.
   */
  verifyAccess(access: Access, nodeData: NodeData, level: AccessLevel): boolean {
    if (access.admin) {
      return true;
    }

    if (nodeData.props.uid === access.uid && checkMode(nodeData.props.mode, level, MaskOwner)) {
      return true;
    }

    if (access.gids.includes(nodeData.props.gid) && checkMode(nodeData.props.mode, level, MaskGroup)) {
      return true;
    }

    if (checkMode(nodeData.props.mode, level, MaskOther)) {
      return true;
    }

    if (nodeData.props.acl && nodeData.props.acl.length > 0) {
      for (const ac of nodeData.props.acl) {
        const validAcl = (ac.uid && ac.uid === access.uid) || (ac.gid && access.gids.includes(ac.gid));

        if (validAcl && checkMode(ac.mode, level, MaskACL)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * @description Assert that a name is valid.
   */
  assertNameValid(name: string) {
    assert(name.length > 0, 'child name is required');
    assert(name.length < 256, 'child name is too long');
    assert(name !== '.', 'child name can not be a single dot');
    assert(name !== '..', 'child name can not be a just two dots');
    assert(name.match(/^[a-zA-Z0-9_\-\.]+$/), 'child name is invalid');
  }

  /**
   * @description Assert that access has the required level for the node and all its children.
   */
  protected async assertAccessRecursive(access: Access, nodeData: NodeData, level: AccessLevel) {
    this.assertAcccess(access, nodeData, level);

    const children = await this.children(ADMIN_ACCESS, nodeData._id, {
      nofollow: true,
    });

    await Promise.all(children.map((c) => this.assertAccessRecursive(access, c, level)));
  }

  /**
   * @description Given a node id returns all possible paths
   * that leads to that node.
   */
  public abstract resolvePaths(access: Access, id: NodeId): Promise<NodePath[]>;

  /**
   * @description Persist a node to the database.
   */
  public abstract persist<T extends NodeAttrs = NodeAttrs>(id: NodeId, ops: PersistOps): Promise<NodeData<T>>;

  /**
   * @description Delete a node from the database.
   */
  public abstract remove(access: Access, id: NodeId): Promise<boolean>;
}

export class NodeGroup extends NodeBase<NodeGroupAttributes> {
  type = NodeType.GROUP;

  async initialize(access: Access, data?: { props?: PartialNodeProps; attrs?: NodeGroupAttributes }) {
    const gid = data?.attrs?.gid || await this.generateGid();

    return super.initialize(access, {
      ...(data || {}),
      props: {
        ...(data?.props || {}),
        mode: 0o770,
      },
      attrs: {
        labels: [],
        ...(data?.attrs || {}),
        gid,
      },
    });
  }

  private async generateGid() {
    const query = { type: NodeType.GROUP };
    const groups = await this.nodefs.find(ADMIN_ACCESS, query);

    const groupsAttrs = await Promise.all(
      (groups as NodeGroup[]).map((group) => group.attrs()),
    );
    const gids = groupsAttrs.map(({ gid }) => gid);

    return Math.max(0, ...gids) + 1;
  }
}

export class NodeAlbum extends NodeBase<NodeAlbumAttributes> {
  type = NodeType.ALBUM;

  async initialize(access: Access, data?: { props?: PartialNodeProps; attrs?: NodeAlbumAttributes }) {
    return super.initialize(access, {
      ...(data || {}),
      props: {
        ...(data?.props || {}),
        acl: [{
          gid: GID_CUSTODIANS,
          mode: getMode('rwx', MaskACL),
        }],
      },
    });
  }
}

export class NodeCamera extends NodeBase<NodeCameraAttributes> {
  type = NodeType.CAMERA;

  async initialize(access: Access, data?: { props?: PartialNodeProps; attrs?: NodeCameraAttributes }) {
    return super.initialize(access, {
      ...(data || {}),
      props: {
        ...(data?.props || {}),
        acl: [{
          gid: GID_CUSTODIANS,
          mode: getMode('rwx', MaskACL),
        }],
      },
    });
  }
}

export class NodeRoot extends NodeBase<NodeRootAttributes> {
  type = NodeType.ROOT;

  static async ensure(nodefs: NodeFSIf, access: Access): Promise<NodeRoot> {
    const node = new NodeRoot(nodefs, crypto.randomUUID());

    await node.initialize(access, {
      props: {
        uid: UID_ADMIN,
        gid: GID_ADMIN,
        mode: 0o775,
      },
      attrs: {
        labels: [],
      },
    });

    await node.persist(access);

    return node;
  }
}

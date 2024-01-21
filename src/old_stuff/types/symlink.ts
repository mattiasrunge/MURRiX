import { Access, Node, NodeType } from '../node/types.ts';
import { NodeBase } from '../node/node.ts';

export type NodeSymlinkAttributes = {
  path: string;
};

export class NodeSymlink extends NodeBase<NodeSymlinkAttributes> {
  type = NodeType.SYMLINK;

  async get(access: Access, nofollow?: boolean): Promise<Node | null> {
    if (nofollow) {
      return this;
    }

    try {
      const { path } = await this.attrs();
      const { node } = await this.nodefs.resolveOne(access, path);

      return node;
    } catch {
      return null;
    }
  }
}

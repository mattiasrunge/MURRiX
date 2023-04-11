import { NodeType } from '../node/types.ts';
import { NodeBase } from '../node/node.ts';

export type NodeDirectoryAttributes = Record<string, never>;

export class NodeDirectory extends NodeBase<NodeDirectoryAttributes> {
  type = NodeType.DIRECTORY;
}

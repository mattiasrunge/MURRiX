import { NodeType } from '../node/types.ts';
import { NodeBase } from '../node/node.ts';

export type NodeFileAttributes = {
  name: string;
  description?: string;
  when?: string; // TODO
  where?: string; // TODO
};

export class NodeFile extends NodeBase<NodeFileAttributes> {
  type = NodeType.FILE;
}

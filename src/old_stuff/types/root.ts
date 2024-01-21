import { NodeType } from '../node/types.ts';
import { NodeBase } from '../node/node.ts';

export type NodeRootAttributes = Record<string, never>;

export class NodeRoot extends NodeBase<NodeRootAttributes> {
  type = NodeType.ROOT;
}

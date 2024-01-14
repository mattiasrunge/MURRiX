import { NodeType } from '../node/types.ts';
import { NodeBase } from '../node/node.ts';

export type NodeTaskAttributes = {
  enabled: boolean;
  command: string;
};

export class NodeTask extends NodeBase<NodeTaskAttributes> {
  type = NodeType.TASK;
}

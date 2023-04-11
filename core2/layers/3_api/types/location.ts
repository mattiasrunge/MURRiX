import { NodeType } from '../node/types.ts';
import { NodeBase } from '../node/node.ts';

export type NodeLocationAttributes = {
  name: string;
  description?: string;
  where?: string; // TODO
};

export class NodeLocation extends NodeBase<NodeLocationAttributes> {
  type = NodeType.LOCATION;
}

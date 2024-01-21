import { NodeType, UserId } from '../node/types.ts';
import { NodeBase } from '../node/node.ts';

export type NodeUserAttributes = {
  uid: UserId;
};

export class NodeUser extends NodeBase<NodeUserAttributes> {
  type = NodeType.USER;
}

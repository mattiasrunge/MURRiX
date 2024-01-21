import { GroupId, NodeType } from '../node/types.ts';
import { NodeBase } from '../node/node.ts';

export type NodeGroupAttributes = {
  gid: GroupId;
};

export class NodeGroup extends NodeBase<NodeGroupAttributes> {
  type = NodeType.GROUP;
}

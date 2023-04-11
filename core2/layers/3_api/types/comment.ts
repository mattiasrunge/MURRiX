import { NodeType } from '../node/types.ts';
import { NodeBase } from '../node/node.ts';

export type NodeCommentAttributes = {
  title: string;
  text: string;
};

export class NodeComment extends NodeBase<NodeCommentAttributes> {
  type = NodeType.COMMENT;
}

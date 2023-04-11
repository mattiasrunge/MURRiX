import { NodeType } from '../node/types.ts';
import { NodeBase } from '../node/node.ts';

export enum NodeTextEventType {
  GENERIC = 'generic',
  BIRTH = 'birth',
  ENGAGEMENT = 'engagement',
  MARRIAGE = 'marriage',
  DEATH = 'death',
}

export type NodeTextAttributes = {
  name: string;
  type: NodeTextEventType;
  when?: string; // TODO
  where?: string; // TODO
  text: string;
};

export class NodeText extends NodeBase<NodeTextAttributes> {
  type = NodeType.TEXT;
}

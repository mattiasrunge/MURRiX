import { NodeType } from '../node/types.ts';
import { NodeBase } from '../node/node.ts';

export enum NodePersonGender {
  MALE = 'm',
  FEMALE = 'f',
  OTHER = 'o',
}

export type NodePersonAttributes = {
  fullname: string;
  birthname?: string;
  gender: NodePersonGender;
  allergies?: string;
};

export class NodePerson extends NodeBase<NodePersonAttributes> {
  type = NodeType.PERSON;
}

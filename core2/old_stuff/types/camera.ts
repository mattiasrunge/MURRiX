import { NodeType } from '../node/types.ts';
import { NodeBase } from '../node/node.ts';

export enum NodeCameraOffsetType {
  FIXED = 'offset_fixed',
  RELATIVE = 'offset_relative_to_position',
}

export type NodeCameraAttributes = {
  title?: string;
  description?: string;
  offsetType?: NodeCameraOffsetType;
  offsetDescription?: string;
  utcOffset?: number;
  autoDST: boolean;
  serialNumber: string;
};

export class NodeCamera extends NodeBase<NodeCameraAttributes> {
  type = NodeType.CAMERA;
}

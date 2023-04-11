import { NodeType } from '../node/types.ts';
import { NodeBase } from '../node/node.ts';

export type NodeAlbumAttributes = {
  title?: string;
  description?: string;
};

export class NodeAlbum extends NodeBase<NodeAlbumAttributes> {
  type = NodeType.ALBUM;
}

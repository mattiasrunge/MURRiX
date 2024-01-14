import { Node, NodeData, NodeId, NodeType } from '../node/types.ts';
import { NodeAlbum } from '../types/album.ts';
import { NodeCamera } from '../types/camera.ts';
import { NodeComment } from '../types/comment.ts';
import { NodeDirectory } from '../types/directory.ts';
import { NodeFile } from '../types/file.ts';
import { NodeGroup } from '../types/group.ts';
import { NodeLocation } from '../types/location.ts';
import { NodePerson } from '../types/person.ts';
import { NodeRoot } from '../types/root.ts';
import { NodeSymlink } from '../types/symlink.ts';
import { NodeTask } from '../types/task.ts';
import { NodeText } from '../types/text.ts';
import { NodeUser } from '../types/user.ts';
import { NodeFS } from '../nodefs/nodefs.ts';

const create = (nodefs: NodeFS, type: NodeType, id: NodeId): Node => {
  switch (type) {
    case NodeType.ROOT:
      return new NodeRoot(nodefs, id);
    case NodeType.ALBUM:
      return new NodeAlbum(nodefs, id);
    case NodeType.CAMERA:
      return new NodeCamera(nodefs, id);
    case NodeType.COMMENT:
      return new NodeComment(nodefs, id);
    case NodeType.DIRECTORY:
      return new NodeDirectory(nodefs, id);
    case NodeType.FILE:
      return new NodeFile(nodefs, id);
    case NodeType.GROUP:
      return new NodeGroup(nodefs, id);
    case NodeType.LOCATION:
      return new NodeLocation(nodefs, id);
    case NodeType.PERSON:
      return new NodePerson(nodefs, id);
    case NodeType.SYMLINK:
      return new NodeSymlink(nodefs, id);
    case NodeType.TASK:
      return new NodeTask(nodefs, id);
    case NodeType.TEXT:
      return new NodeText(nodefs, id);
    case NodeType.USER:
      return new NodeUser(nodefs, id);
  }
};

export const factory = (nodefs: NodeFS, type: NodeType, id: NodeId, nodeData?: NodeData): Node => {
  const node = create(nodefs, type, id);
  if (nodeData) {
    node.setData(nodeData);
  }

  return node;
};

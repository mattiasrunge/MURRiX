import { JSONValue } from '~/layers/0_common/mod.ts';
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

export enum NodeType {
  ROOT = 'r',
  ALBUM = 'a',
  CAMERA = 'c',
  COMMENT = 'k',
  DIRECTORY = 'd',
  FILE = 'f',
  GROUP = 'g',
  LOCATION = 'l',
  PERSON = 'p',
  SYMLINK = 's',
  TASK = 'j',
  TEXT = 't',
  USER = 'u',
}

export type Node =
  | NodeAlbum
  | NodeCamera
  | NodeComment
  | NodeDirectory
  | NodeFile
  | NodeGroup
  | NodeLocation
  | NodePerson
  | NodeRoot
  | NodeSymlink
  | NodeTask
  | NodeText
  | NodeUser;

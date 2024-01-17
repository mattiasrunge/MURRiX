import { checkMode, MaskACL, MaskGroup, MaskOther, MaskOwner } from '~/src/shared/mode/mod.ts';
import { Access, AccessLevel } from '~/src/shared/access/mod.ts';
import { NodeData } from '../types.ts';

/**
 * @description Verify that the access has the required level for the node.
 */
export const verifyAccess = (
  access: Access,
  nodeData: NodeData,
  level: AccessLevel,
) => {
  if (access.admin) {
    return true;
  }

  if (nodeData.props.uid === access.uid && checkMode(nodeData.props.mode, level, MaskOwner)) {
    return true;
  }

  if (access.gids.includes(nodeData.props.gid) && checkMode(nodeData.props.mode, level, MaskGroup)) {
    return true;
  }

  if (checkMode(nodeData.props.mode, level, MaskOther)) {
    return true;
  }

  if (nodeData.props.acl && nodeData.props.acl.length > 0) {
    for (const ac of nodeData.props.acl) {
      const validAcl = (ac.uid && ac.uid === access.uid) || (ac.gid && access.gids.includes(ac.gid));

      if (validAcl && checkMode(ac.mode, level, MaskACL)) {
        return true;
      }
    }
  }

  return false;
};

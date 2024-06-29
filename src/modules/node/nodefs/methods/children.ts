import { Collection } from '@db/mongo';
import { Access } from '~/src/shared/access/mod.ts';
import { NamedNodeData, NodeData, NodeId, NodeResolveOptions } from '../types.ts';
import { findOne } from './find-one.ts';
import { find } from './find.ts';
import { resolveOne } from './resolve-one.ts';

/**
 * @description Get the children of a node.
 */
export const children = async (
  col: Collection<NodeData>,
  access: Access,
  id: NodeId,
  options?: NodeResolveOptions,
): Promise<NamedNodeData[]> => {
  const nodeData = await findOne(col, access, { _id: id });
  const children = nodeData.props.children;
  const query = { _id: { $in: children.map(({ id }) => id) } };
  const nodeDataList = await find(col, access, query);

  return await Promise.all(
    nodeDataList.map(async (nodeData) => {
      // Name should be saved before we resolve a possible link
      // so we actually has a name corresponding to the id.
      const name = children.find((c) => c.id === nodeData._id)!.name;

      if (nodeData.props.link && !(options?.nofollow || options?.readlink)) {
        const linkNodeData = await resolveOne(col, access, nodeData.props.link);

        if (linkNodeData) {
          nodeData = linkNodeData;
        }
      }

      return {
        ...nodeData,
        name,
      };
    }),
  );
};

import { Access } from '../access/mod.ts';
import { LocalNodeFS } from './local-nodefs.ts';
import { NodeChild, NodeData, NodeId, NodePath } from './types.ts';

type NodeDataWithParents = NodeData & {
  parents: NodeDataWithParents[];
};

const constructPaths = (parents: Array<NodeDataWithParents>, id: NodeId): Array<NodePath> => {
  const list = [];

  for (const parent of parents) {
    const children = parent.props.children.filter((child: NodeChild) => child.id === id);

    if (children.length > 0) {
      const paths = constructPaths(parents, parent._id);

      if (paths.length > 0) {
        for (const path of paths) {
          for (const child of children) {
            list.push(`${path}/${child.name}`);
          }
        }
      } else {
        for (const child of children) {
          list.push(`/${child.name}`);
        }
      }
    }
  }

  return list;
};

export const getPaths = async (nodefs: LocalNodeFS, access: Access, id: NodeId): Promise<NodePath[]> => {
  const pipeline = [
    {
      $match: { _id: id },
    },
    {
      $graphLookup: {
        from: 'nodes',
        startWith: '$_id',
        connectFromField: '_id',
        connectToField: 'props.children.id',
        as: 'parents',
      },
    },
  ];

  const collection = nodefs.phy.db.collection('nodes');
  const cursor = await collection.aggregate<NodeDataWithParents>(pipeline);
  const nodeDataList = await cursor.toArray();

  if (nodeDataList.length === 0) {
    return [];
  }

  const nodeData = nodeDataList[0];

  if (!nodefs.verifyAccess(access, nodeData, 'r')) {
    throw new Error('permission denied');
  }

  const paths = constructPaths(nodeData.parents, nodeData._id);

  paths.sort((a, b) => a.localeCompare(b));

  return paths;
};

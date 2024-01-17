public async resolveShared(access: Access, id: NodeId): Promise<Node> {
  const type = await SharedData.peek<NodeType>(this.phy, id, 'type');

  if (!type) {
    throw new Error(`no shared node with id ${id}`);
  }

  const node = factory(this, type, id);
  await node.loadShared();

  await node.assertAccess(access, 'r');

  return node;
}
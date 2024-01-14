import { NodeFSDB } from './nodefs-db.ts';
import { MQ } from '~/external/mq/mod.ts';
import {
  AddChildReq,
  AddChildRes,
  ChildrenReq,
  ChildrenRes,
  FindOneReq,
  FindOneRes,
  FindReq,
  FindRes,
  PersistReq,
  PersistRes,
  RemoveChildReq,
  RemoveChildRes,
  RemoveReq,
  RemoveRes,
  ResolveOneReq,
  ResolveOneRes,
  ResolvePathsReq,
  ResolvePathsRes,
  ResolveReq,
  ResolveRes,
  SetAttrsReq,
  SetAttrsRes,
  SetPropsReq,
  SetPropsRes,
} from './internal-types.ts';

export const exposeNodeFS = async (nodefs: NodeFSDB, mq: MQ) => {
  await mq.requestHandler<FindReq, FindRes>(
    'nodefs.find',
    ({ access, query }) => nodefs.find(access, query),
  );

  await mq.requestHandler<FindOneReq, FindOneRes>(
    'nodefs.findOne',
    ({ access, query }) => nodefs.findOne(access, query),
  );

  await mq.requestHandler<ResolveReq, ResolveRes>(
    'nodefs.resolve',
    ({ access, path, options }) => nodefs.resolve(access, path, options),
  );

  await mq.requestHandler<ResolveOneReq, ResolveOneRes>(
    'nodefs.resolveOne',
    ({ access, path, options }) => nodefs.resolveOne(access, path, options),
  );

  await mq.requestHandler<ChildrenReq, ChildrenRes>(
    'nodefs.children',
    ({ access, id, options }) => nodefs.children(access, id, options),
  );

  await mq.requestHandler<AddChildReq, AddChildRes>(
    'nodefs.addChild',
    ({ access, parentId, childId, childName }) => nodefs.addChild(access, parentId, childId, childName),
  );

  await mq.requestHandler<RemoveChildReq, RemoveChildRes>(
    'nodefs.removeChild',
    ({ access, parentId, childName }) => nodefs.removeChild(access, parentId, childName),
  );

  await mq.requestHandler<SetPropsReq, SetPropsRes>(
    'nodefs.setProps',
    ({ access, id, props, options }) => nodefs.setProps(access, id, props, options),
  );

  await mq.requestHandler<SetAttrsReq, SetAttrsRes>(
    'nodefs.setAttrs',
    ({ access, id, attrs }) => nodefs.setAttrs(access, id, attrs),
  );

  await mq.requestHandler<ResolvePathsReq, ResolvePathsRes>(
    'nodefs.resolvePaths',
    ({ access, id }) => nodefs.resolvePaths(access, id),
  );

  await mq.requestHandler<PersistReq, PersistRes>(
    'nodefs.persist',
    ({ id, ops }) => nodefs.persist(id, ops),
  );

  await mq.requestHandler<RemoveReq, RemoveRes>(
    'nodefs.remove',
    ({ access, id }) => nodefs.remove(access, id),
  );
};

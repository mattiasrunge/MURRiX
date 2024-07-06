import { ApiContext } from '~/src/shared/api/types.ts';
import { NamedNodeData, NodePath } from '~/src/modules/node/types.ts';
import { PersonAttrs, PersonTree } from '../types.ts';

export type ApiIf = {
  getFamily(ctx: ApiContext, args: { path: NodePath }): Promise<PersonTree>;
  makePerson(ctx: ApiContext, args: PersonAttrs): Promise<NamedNodeData<PersonAttrs>>;
  setFather(ctx: ApiContext, args: { childPath: NodePath; fatherPath: NodePath }): Promise<boolean>;
  setMother(ctx: ApiContext, args: { childPath: NodePath; motherPath: NodePath }): Promise<boolean>;
  setPartner(ctx: ApiContext, args: { personPath: NodePath; partnerPath: NodePath }): Promise<boolean>;
};

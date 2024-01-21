import { NamedNodeData, NodeAttrs } from '~/src/modules/node/mod.ts';

export type PersonGender = 'm' | 'f' | 'o' | 'u';

export type PersonContact = {
  type: string;
  data: string;
};

export type PersonParents = {
  person: NamedNodeData<PersonAttrs>;
  mother: PersonParents | null;
  father: PersonParents | null;
};

export type PersonChildren = {
  person: NamedNodeData<PersonAttrs>;
  children: PersonChildren[];
};

export type PersonTree = PersonParents & PersonChildren;

export type PersonAttrs = NodeAttrs & {
  name: string;
  fullname?: string | null;
  birthname?: string | null;
  description?: string | null;
  allergies?: string | null;
  gender?: PersonGender | null;
  contact?: PersonContact[] | null;
  idV0?: number | null;
  idV1?: string | null;
};

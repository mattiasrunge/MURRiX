import { NamedNodeData, NodeAttrs } from '~/layers/2_nodefs/mod.ts';

export enum PersonGender {
  MALE = 'm',
  FEMALE = 'f',
  OTHER = 'o',
  UNKNOWN = 'u',
}

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
  fullname?: string;
  birthname?: string;
  description?: string;
  allergies?: string;
  gender?: PersonGender | null;
  contact?: PersonContact[];
  idV0?: number;
  idV1?: string;
};

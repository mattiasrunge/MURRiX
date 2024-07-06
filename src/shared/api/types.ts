import { Access } from '~/src/shared/access/types.ts';
import { JSONObject, JSONValue } from '~/src/shared/types.ts';

export type ApiFunction = (ctx: ApiContext, args: JSONObject) => Promise<JSONValue>;

export type ApiConnection = {
  call: (name: string, access: Access, args: JSONObject) => Promise<JSONValue>;
};

export type ApiContext<T = any> = {
  connection: ApiConnection;
  access: Access;
  service: T;
};

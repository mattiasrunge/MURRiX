import { JSONObject } from '~/src/shared/types.ts';
import { ApiContext } from './types.ts';

export const createApi = <T extends object>(name: string) => {
  const handler: ProxyHandler<T> = {
    get(_target, prop, _receiver) {
      const fnName = `${name}.${String(prop)}`;

      return (ctx: ApiContext, args: JSONObject) => {
        return ctx.connection.call(fnName, ctx.access, args);
      };
    },
  };

  return new Proxy<T>({} as T, handler);
};

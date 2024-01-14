import { JSONValue } from '~/lib/types.ts';
import { API } from './api.ts';

type WrappableFunction<IN, OUT> = (api: API, args: IN) => Promise<OUT>;
type LoadFunction = (api: API) => Promise<() => Promise<void>>;

export interface WrappedFunction {
  (api: API, args: any): Promise<unknown>;
  load: LoadFunction;
}

function wrap<IN extends JSONValue, OUT extends JSONValue>(url: string, fn: WrappableFunction<IN, OUT>) {
  const name = [
    'api',
    ...url.split('/').slice(-2).map((n) => n.replace('.ts', '')),
  ].join('.');

  const outFn = (api: API, args: IN): Promise<OUT> =>
    api.mq.request<IN, OUT>(
      name,
      args,
    );

  outFn.load = (api: API) =>
    api.mq.requestHandler<IN, OUT>(
      name,
      (args) => fn(api, args),
    );

  return outFn;
}

export { wrap };

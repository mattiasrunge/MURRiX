import { assert } from '@std/assert';
import { JSONValue } from '~/src/shared/types.ts';
import { ServiceIf } from '../types.ts';

type WrappableFunction<IN, OUT> = (service: ServiceIf, args: IN) => Promise<OUT>;
type LoadFunction = (service: ServiceIf) => Promise<() => Promise<void>>;

export interface WrappedFunction {
  (service: ServiceIf, args: any): Promise<unknown>;
  load: LoadFunction;
  fnName: string;
}

const NAME_REGEX = /\/([^\/]+\/[^\/]+\/[^\/]+\.ts):/;

const parseName = () => {
  const stack = new Error().stack;
  assert(stack, 'Could not get error stack');

  const line = stack!.split('\n')[3];
  assert(line, 'Could not find the correct line in the stack');

  const match = line.match(NAME_REGEX);
  assert(match && match[1], 'Could not match the correct part');

  return match[1].replace(/\.ts$/, '').replace(/\//g, '.');
};

function api<IN extends JSONValue, OUT extends JSONValue>(fn: WrappableFunction<IN, OUT>) {
  const name = parseName();
  let loaded = false;

  const outFn = (service: ServiceIf, args: IN): Promise<OUT> => {
    if (loaded) {
      return fn(service, args);
    }

    return service.getMq().request<IN, OUT>(
      name,
      args,
    );
  };

  outFn.load = (service: ServiceIf) => {
    loaded = true;
    return service.getMq().requestHandler<IN, OUT>(
      name,
      (args) => fn(service, args),
    );
  };

  outFn.fnName = name;

  return outFn;
}

export { api };

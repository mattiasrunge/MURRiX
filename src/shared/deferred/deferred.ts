export interface Deferred<T> extends Promise<T> {
  resolve(value?: T | PromiseLike<T>): void;
  reject(reason?: any): void;
}

export function deferred<T>(): Deferred<T> {
  const { promise, resolve, reject } = Promise.withResolvers();

  return Object.assign(promise, { resolve, reject }) as Deferred<T>;
}

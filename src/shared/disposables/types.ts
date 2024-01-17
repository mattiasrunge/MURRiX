export type DisposableFn = () => Promise<void>;
export type DisposableObject = { destroy(): Promise<void> };

export type Disposable = DisposableFn | DisposableObject;

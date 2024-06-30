export type Branch = {
  name: string;
  page?: string;
  layout?: string;
  loader?: string;
  action?: string;
  error?: string;
  children: Branch[];
};

export type File = {
  name: string;
  size: number;
};

export type Watcher = (kind: string, path: string) => Promise<void>;

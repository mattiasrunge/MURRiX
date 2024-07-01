export type BuildOptions = {
  srcDir: string;
  distDir: string;
  workDir: string;
  denoConfigPath: string;
  alias?: Record<string, string>;
  imports?: string[];
  dev?: boolean;
};

export type Branch = {
  name: string;
  page?: string;
  layout?: string;
  loader?: string;
  action?: string;
  error?: string;
  children: Branch[];
};

export type Watcher = (kind: string, path: string) => Promise<void>;

export type StepOptions = {
  name: string;
  fn: () => Promise<string[]>;
  watchChanges?: boolean;
};

export type InternalOptions = BuildOptions & {
  appFile: string;
};

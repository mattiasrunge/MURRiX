export type BundleOptions = {
  indexFile: string;
  appDir: string;
  staticDir: string;
  distDir: string;
  denoConfigPath: string;
  alias?: Record<string, string>;
  imports?: string[];
  dev?: boolean;
};

export type Branch = {
  path: string;
  name: string;
  page?: string;
  layout?: string;
  loader?: string;
  action?: string;
  error?: string;
  children: Branch[];
};

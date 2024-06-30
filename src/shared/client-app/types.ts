export type BuildOptions = {
  srcDir: string;
  distDir: string;
  workDir: string;
  denoConfigPath: string;
  alias?: Record<string, string>;
  imports?: string[];
  dev?: boolean;
};

import { resolve } from '@std/path';
import { build, context, stop } from 'esbuild';
import { denoPlugins } from 'esbuild-deno-loader';
import anyFilePlugin from 'esbuild-plugin-any-file';
import gzipPlugin from 'esbuild-plugin-gzip';
import { BuildOptions } from '../types.ts';

export const bundleApp = async (opts: BuildOptions, appFile: string) => {
  if (opts.dev) {
    console.log(`[watch] build started`);
  }

  const options = {
    logLevel: 'info',
    plugins: [
      ...denoPlugins({
        configPath: resolve(opts.denoConfigPath),
      }),
      anyFilePlugin(),
      gzipPlugin({
        uncompressed: true,
        gzip: !opts.dev,
        brotli: !opts.dev,
      }),
    ],
    entryPoints: [appFile],
    outdir: opts.distDir,
    bundle: true,
    write: false,
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
      '.js': 'jsx',
      '.jsx': 'jsx',
      '.woff2': 'file',
      '.css': 'css',
    },
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.css', '.woff2'],
    alias: opts.alias,
    format: 'esm',
    target: 'chrome125',
    minify: !opts.dev,
    sourcemap: !opts.dev,
    treeShaking: !opts.dev,
    jsx: 'automatic',
  };

  if (opts.dev) {
    const ctx = await context(options);

    await ctx.watch();
  } else {
    await build(options);

    await stop();
  }
};

import { resolve } from '@std/path';
import { build, context, stop } from 'esbuild';
import { denoPlugins } from 'esbuild-deno-loader';
import anyFilePlugin from 'esbuild-plugin-any-file';
import gzipPlugin from 'esbuild-plugin-gzip';
import { InternalOptions } from '../types.ts';
import { step } from '../lib/step.ts';

export const stepBuild = async (opts: InternalOptions) => {
  const options = {
    logLevel: opts.dev ? 'info' : undefined,
    color: false,
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
    entryPoints: [opts.appFile],
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
    format: 'iife',
    target: 'chrome125',
    minify: !opts.dev,
    sourcemap: !opts.dev,
    treeShaking: true,
    jsx: 'automatic',
  };

  await step(opts, {
    name: 'build',
    fn: async () => {
      if (opts.dev) {
        const ctx = await context(options);
        await ctx.watch();
      } else {
        await build(options);
        await stop();
      }

      return [];
    },
  });
};

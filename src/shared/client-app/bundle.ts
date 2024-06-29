import { resolve } from '@std/path';
import { build, stop } from 'esbuild';
import { denoPlugins } from 'esbuild-deno-loader';
import anyFilePlugin from 'esbuild-plugin-any-file';
import gzipPlugin from 'esbuild-plugin-gzip';
import { BundleOptions } from './types.ts';

export const bundle = async (opts: BundleOptions, appFile: string) => {
  console.log('Building...');

  await build({
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
  });

  await stop();
};

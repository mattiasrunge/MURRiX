import { Context, HTTPMethods, RouterMiddleware } from '@oak/oak';
import { Access } from '~/src/shared/access/mod.ts';

export type HttpMethod = HTTPMethods;
export type HttpRouteHandler = RouterMiddleware<string>;
export type HttpAccessResolver = (sid?: string) => Promise<Access>;
export type HttpContext = Context;

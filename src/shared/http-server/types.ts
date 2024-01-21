import { HTTPMethods, RouterMiddleware } from 'oak';

export type HttpMethod = HTTPMethods;
export type HttpRouteHandler = RouterMiddleware<string>;

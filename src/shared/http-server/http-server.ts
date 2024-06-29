import { decodeBase64 } from '@std/encoding';
import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http';
import { Application, isHttpError, Next, Router } from '@oak/oak';
import { oakCors } from 'oakCors';
import { log } from '~/src/shared/log/mod.ts';
import { getRequest, setResponse } from './request-transform.ts';
import { HttpAccessResolver, HttpContext, HttpMethod, HttpRouteHandler } from './types.ts';

const DEFAULT_COOKIE_NAME = 'murrix';

type RequestExtras = {
  incomingMessage: IncomingMessage;
  serverResponse: ServerResponse;
};

type ExtendedRequest = Request & RequestExtras;

export const getRequestExtras = (context: HttpContext) => {
  return ((context.request.originalRequest as any).request as RequestExtras);
};

export const getContextFromIncomingMessage = (req: IncomingMessage) => {
  return (req as any).context as HttpContext;
};

export class HttpServer {
  private baseUrl: string;
  private port: number;
  private server: Server;
  private app: Application;
  private router: Router;
  private accessResolver?: HttpAccessResolver;

  constructor(baseUrl: string, port: number) {
    this.baseUrl = baseUrl;
    this.port = port;
    this.server = createServer(this.requestListener.bind(this));
    this.app = new Application({ contextState: 'alias', logErrors: false });
    this.router = new Router();

    this.app.addEventListener('error', (evt) => {
      if (!isHttpError(evt.error)) {
        log.error(`[HTTP] Internal error:`, evt.error);
      }
    });
  }

  private async requestListener(req: IncomingMessage, res: ServerResponse) {
    log.debug(`Request (${req.method}) to ${req.url}, headers:`, req.headers);
    const request = await getRequest(this.baseUrl, req);

    (request as ExtendedRequest).incomingMessage = req;
    (request as ExtendedRequest).serverResponse = res;

    const response = await this.app.handle(request);

    if (response) {
      await setResponse(res, response);
    }
  }

  public setAccessResolver(resolver: HttpAccessResolver) {
    this.accessResolver = resolver;
  }

  public addRoute(methods: HttpMethod[], path: string, handler: HttpRouteHandler) {
    log.debug(`Route registered for ${path} - ${methods.join(',')}`);
    this.router.add(methods, path, handler);
  }

  private async addContextToRequest(context: HttpContext, next: Next) {
    const { incomingMessage } = (context.request.originalRequest as any).request as RequestExtras;

    (incomingMessage as any).context = context;

    await next();
  }

  private async authorize(context: HttpContext, next: Next) {
    if (!this.accessResolver) {
      context.throw(500, 'No access resolver set');
    }

    const cookie = await context.cookies.get(DEFAULT_COOKIE_NAME);
    const auth = context.request.headers.get('Authorization');

    if (auth) {
      const [type, data] = auth.split(' ');

      if (type.toLowerCase() === 'bearer') {
        context.assert(data, 403, 'Invalid authorization header');

        context.state.access = await this.accessResolver(data);
        await context.cookies.set(DEFAULT_COOKIE_NAME, context.state.access.sid);
      } else if (type.toLowerCase() === 'basic') {
        const [, password] = new TextDecoder().decode(decodeBase64(data)).split(':');
        context.assert(data, 403, 'Invalid authorization header');

        context.state.access = await this.accessResolver(password);
      }
    }

    if (!context.state.access) {
      context.state.access = await this.accessResolver(cookie);
    }

    if (cookie !== context.state.access.sid) {
      await context.cookies.set(DEFAULT_COOKIE_NAME, context.state.access.sid);
    }

    await next();
  }

  public async listen() {
    this.app.use(oakCors());
    this.app.use(this.addContextToRequest.bind(this));
    this.app.use(this.authorize.bind(this));
    this.app.use(this.router.routes());
    this.app.use(this.router.allowedMethods());

    await new Promise<void>((resolve, reject) => {
      this.server.once('error', (error: Error) => {
        this.server.close();
        reject(error);
      });

      this.server.listen(this.port, resolve);
    });
  }

  public async stop() {
    await new Promise<void>((resolve, reject) => {
      this.server.close((error?: Error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}

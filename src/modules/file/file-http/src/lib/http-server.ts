import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http';
import { Application, createHttpError, HTTPMethods, isHttpError, Middleware, Router, RouterContext, RouterMiddleware } from 'oak';
import { oakCors } from 'oakCors';
import { getRequest, setResponse } from '~/src/lib/request-transform.ts';
import { log } from '~/src/lib/log.ts';
import { decodeBase64 } from 'std/encoding/base64.ts';

type RequestExtras = {
  incomingMessage: IncomingMessage;
  serverResponse: ServerResponse;
};

type ExtendedRequest = Request & RequestExtras;

export const getRequestExtras = (context: RouterContext<string>) => {
  return ((context.request.originalRequest as any).request as RequestExtras);
};

export class HttpServer {
  private baseUrl: string;
  private port: number;
  private server: Server;
  private app: Application;
  private router: Router;
  private authorizedTokens: string[];

  constructor(baseUrl: string, port: number, authorizedTokens: string[]) {
    this.baseUrl = baseUrl;
    this.port = port;
    this.authorizedTokens = authorizedTokens;
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

  public addRoute(methods: HTTPMethods[] | HTTPMethods, path: string, handler: RouterMiddleware<string>) {
    log.debug(`Route registered for ${path} - ${Array.isArray(methods) ? methods.join(',') : methods}`);
    this.router.add(methods, path, handler);
  }

  private async authorize(headers: Headers) {
    const auth = headers.get('Authorization');

    if (!auth) {
      throw createHttpError(403, 'Missing correct authorization header');
    }

    const [type, data] = auth.split(' ');
    let token = '';

    if (type.toLowerCase() === 'bearer') {
      token = data;
    } else if (type.toLowerCase() === 'basic') {
      token = new TextDecoder().decode(decodeBase64(data)).split(':')[1];
    }

    if (!token || !this.authorizedTokens.includes(token)) {
      throw createHttpError(403, 'Permission denied');
    }
  }

  public async listen() {
    const authMiddleware: Middleware = async (context, next) => {
      await this.authorize(context.request.headers);
      await next();
    };

    this.app.use(oakCors());
    this.app.use(authMiddleware);
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

import { HttpAccessResolver, HttpMethod, HttpRouteHandler, HttpServer } from '~/src/shared/http-server/mod.ts';
import { log } from '~/src/shared/log/mod.ts';
import { HPConfig } from './types.ts';

export class HP {
  private config: HPConfig;
  private server: HttpServer;

  private constructor(config: HPConfig) {
    this.config = config;
    this.server = new HttpServer(config.baseUrl, config.port);
  }

  static async create(config: HPConfig) {
    const hp = new HP(config);

    await hp.server.listen();
    log.info(`Server is running on port ${config.port}`);
    log.info(`Base url is ${config.baseUrl}`);

    return hp;
  }

  public addRoute(methods: HttpMethod[], path: string, handler: HttpRouteHandler) {
    this.server.addRoute(methods, path, handler);
    // TODO: Add to proxy
  }

  public setAccessResolver(resolver: HttpAccessResolver) {
    this.server.setAccessResolver(resolver);
  }

  async destroy() {
    await this.server.stop();
  }
}

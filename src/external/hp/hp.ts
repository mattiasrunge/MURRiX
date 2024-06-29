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

  public async addRoute(methods: HttpMethod[], path: string, handler: HttpRouteHandler) {
    this.server.addRoute(methods, path, handler);

    let basePath = path.split(':')[0];
    if (basePath !== '/' && basePath.endsWith('/')) {
      basePath = basePath.slice(0, -1);
    }

    const resp = await fetch(`${this.config.nginxHarnessUrl}/_route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: basePath,
        target: `http://localhost:${this.config.port}${basePath}`,
      }),
    });

    if (!resp.ok) {
      throw new Error(`Failed to add route: ${resp.statusText}`);
    }
  }

  public setAccessResolver(resolver: HttpAccessResolver) {
    this.server.setAccessResolver(resolver);
  }

  async destroy() {
    await this.server.stop();
  }
}

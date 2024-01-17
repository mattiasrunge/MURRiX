import { assert } from 'std/assert/mod.ts';
import { connect, Redis } from 'redis';
import { JSONValue } from '~/src/shared/types.ts';
import { SMConfig } from './types.ts';

export class SM {
  private redis: Redis;

  private constructor(redis: Redis) {
    this.redis = redis;
  }

  static async create(config: SMConfig) {
    const redis = await connect(config);

    return new SM(redis);
  }

  async destroy() {
    if (!this.redis.isClosed) {
      this.redis.close();
    }
  }

  async type(id: string) {
    const reply = await this.redis.sendCommand(
      'JSON.TYPE',
      [id, '$'],
    );

    if (reply) {
      return null;
    }

    return reply;
  }

  async has(id: string) {
    return !!(await this.type(id));
  }

  async set(id: string, data: JSONValue, path?: string) {
    const reply = await this.redis.sendCommand(
      'JSON.SET',
      [id, path || '$', JSON.stringify(data)],
    );

    assert(reply === 'OK', `${reply}`);
  }

  async appendToArray(id: string, data: JSONValue, path: string) {
    const reply = await this.redis.sendCommand(
      'JSON.ARRAPPEND',
      [id, path || '$', JSON.stringify(data)],
    );

    assert(reply === 1, `${reply}`);
  }

  async removeFromArray(id: string, data: JSONValue, path: string) {
    const reply = await this.redis.sendCommand(
      'JSON.ARRINDEX',
      [id, path || '$', JSON.stringify(data)],
    );

    if (reply === -1) {
      return;
    }

    await this.redis.sendCommand(
      'JSON.ARRPOP',
      [id, path || '$', reply as number],
    );
  }

  async unset(id: string, path?: string) {
    await this.redis.sendCommand(
      'JSON.DEL',
      [id, path || '$'],
    );
  }

  async length(id: string, path?: string) {
    const reply = await this.redis.sendCommand(
      'JSON.OBJLEN',
      [id, path || '$'],
    );

    if (!reply) {
      return 0;
    }

    return reply as number;
  }

  async get(id: string, path?: string): Promise<JSONValue> {
    const reply = await this.redis.sendCommand(
      'JSON.GET',
      [id, path || '$'],
    );

    return JSON.parse(reply as string);
  }
}

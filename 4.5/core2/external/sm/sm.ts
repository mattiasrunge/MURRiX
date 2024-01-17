import { assert } from 'std/_util/asserts.ts';
import { connect, Redis } from 'redis';
import { JSONValue } from '~/lib/types.ts';
import { Service } from '~/lib/service/mod.ts';
import { SMConfig, SMIf } from './types.ts';
import { SharedData } from './shared-data/mod.ts';

export class SM implements SMIf {
  private service: Service;
  private redis: Redis;

  private constructor(service: Service, redis: Redis) {
    this.service = service;
    this.redis = redis;
  }

  static async connect(service: Service, config: SMConfig) {
    const redis = await connect(config);

    return new SM(service, redis);
  }

  async close() {
    if (!this.redis.isClosed) {
      this.redis.close();
    }
  }

  async has(id: string) {
    try {
      const reply = await this.redis.sendCommand(
        'JSON.TYPE',
        id,
        '$',
      );

      const replyArray = reply.array();

      return replyArray !== null && replyArray[0] === 'object';
    } catch {
      return false;
    }
  }

  async set(id: string, data: JSONValue, path?: string) {
    const reply = await this.redis.sendCommand(
      'JSON.SET',
      id,
      path || '$',
      JSON.stringify(data),
    );

    assert(reply.string() === 'OK', reply.string());
  }

  async appendToArray(id: string, data: JSONValue, path: string) {
    const reply = await this.redis.sendCommand(
      'JSON.ARRAPPEND',
      id,
      path || '$',
      JSON.stringify(data),
    );

    const value = reply.array() as number[];

    if (!value || value.length === 0) {
      return;
    }

    assert(value[0] > 0, 'append did not do anything');
  }

  async removeFromArray(id: string, data: JSONValue, path: string) {
    const reply = await this.redis.sendCommand(
      'JSON.ARRINDEX',
      id,
      path || '$',
      JSON.stringify(data),
    );

    // value will always be returned as an array
    const value = reply.array();

    if (!value || value.length === 0) {
      return;
    }

    const index = value[0] as number;

    await this.redis.sendCommand(
      'JSON.ARRPOP',
      id,
      path || '$',
      index,
    );
  }

  async unset(id: string, path?: string) {
    await this.redis.sendCommand(
      'JSON.DEL',
      id,
      path || '$',
    );
  }

  async length(id: string, path?: string) {
    const reply = await this.redis.sendCommand(
      'JSON.OBJLEN',
      id,
      path || '$',
    );

    return reply.integer();
  }

  async get(id: string, path?: string): Promise<JSONValue> {
    const reply = await this.redis.sendCommand(
      'JSON.GET',
      id,
      path || '$',
    );

    const value = JSON.parse(reply.string());

    // value will always be returned as an array
    // and we will return the first matching value

    return value[0];
  }

  async loadShared<T extends JSONValue>(id: string): Promise<SharedData<T>> {
    return SharedData.load<T>(this.service, this, id);
  }

  async createShared<T extends JSONValue>(id: string, data: T): Promise<SharedData<T>> {
    return SharedData.create<T>(this.service, this, id, data);
  }
}

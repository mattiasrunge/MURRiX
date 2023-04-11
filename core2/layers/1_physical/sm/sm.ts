import { assert } from 'std/_util/asserts.ts';
import { connect, Redis } from 'redis';
import { StateData } from './types.ts';
import { SMConfig } from './types.ts';

export class SM {
  private instanceId: string;
  private redis: Redis;

  private constructor(instanceId: string, redis: Redis) {
    this.instanceId = instanceId;
    this.redis = redis;
  }

  static async connect(instanceId: string, config: SMConfig) {
    const redis = await connect(config);

    return new SM(instanceId, redis);
  }

  async close() {
    if (!this.redis.isClosed) {
      this.redis.close();
    }
  }

  get db() {
    return this.redis;
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

  async set(id: string, data: StateData, path?: string) {
    const reply = await this.redis.sendCommand(
      'JSON.SET',
      id,
      path || '$',
      JSON.stringify(data),
    );

    assert(reply.string() === 'OK', reply.string());
  }

  async appendToArray(id: string, data: StateData, path: string) {
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

  async removeFromArray(id: string, data: StateData, path: string) {
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

  async get(id: string, path?: string): Promise<StateData> {
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

  // async sessionSet(sid: SessionId, data: SessionData, timeout?: number) {
  // }

  // async sessionRemove(sid: SessionId) {
  // }

  // async sessionGet(sid: SessionId): Promise<SessionData> {
  // }

  // async lockAquire(rid: ResourceId, timeout?: number): Promise<LockId> {
  // }

  // async lockRelease(lid: LockId) {
  // }
}

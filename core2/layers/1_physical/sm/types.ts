import { RedisConnectOptions } from 'redis';
import { JSONValue } from '~/layers/0_common/mod.ts';

export type SMConfig = RedisConnectOptions;

// export type SessionId = string;
export type StateData = JSONValue;

// export type Session = {
//   sid: SessionId;
//   data: SessionData;
// };

// export type ResourceId = string;
// export type LockId = string;

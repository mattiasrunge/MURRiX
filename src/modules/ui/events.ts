import { Access } from '~/src/shared/access/types.ts';

export enum SocketEventType {
  SocketEventTypeSessionUpdated = 'session-updated',
}

export type SocketEvent<T = any> = {
  type: SocketEventType;
  payload: T;
};

export type SocketEventSessionUpdated = SocketEvent<Access> & {
  type: SocketEventType.SocketEventTypeSessionUpdated;
};

export type SocketEventHandler = (event: SocketEvent) => Promise<void>;

import { ApiConnection, ApiContext } from '~/src/shared/api/types.ts';
import { Access } from '~/src/shared/access/types.ts';
import { JSONObject, JSONValue } from '~/src/shared/types.ts';
import { Deferred, deferred } from '~/src/shared/deferred/mod.ts';
import { SocketEvent, SocketEventHandler, SocketEventType } from '~/src/modules/ui/events.ts';

let messageIdCounter = 0;
const TIMEOUT = 1000 * 60 * 5; // 5 minute

export class Socket implements ApiConnection {
  private ws: WebSocket | null = null;
  private requests: Record<number, Deferred<JSONValue>> = {};
  private destoyed = false;
  private subscribers: Partial<Record<SocketEventType, SocketEventHandler[]>> = {};
  private ready: Deferred<boolean> = deferred();
  private readyHandlers: (() => Promise<void>)[] = [];

  async connect() {
    this.ws = new WebSocket('/ws');

    return new Promise<void>((resolve, reject) => {
      if (!this.ws) {
        reject(new Error('no ws'));
        return;
      }

      this.ws.onopen = async () => {
        console.log('connected');
        resolve();
        this.ready.resolve(true);

        for (const handler of this.readyHandlers) {
          handler().catch((error) => console.error(error));
        }
      };

      this.ws.onerror = (event) => {
        console.log('error', event);
        reject(new Error('error'));
      };

      this.ws.onclose = (event) => {
        this.ready = deferred();

        console.log('close', event);
        if (this.destoyed) {
          return;
        }

        setTimeout(() => {
          console.log('reconnecting');
          this.connect();
        }, 1000);
      };

      this.ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'response') {
          this.handleResponse(data.messageId, data.result, data.error);
        } else if (data.type === 'event') {
          this.handleEvent(data.event);
        } else {
          console.log('unknown message type', data);
        }
      };
    });
  }

  private handleEvent(event: SocketEvent) {
    console.log('event', event);
    if (!this.subscribers[event.type]) {
      return;
    }

    for (const handler of this.subscribers[event.type]!) {
      handler(event).catch((error) => console.error(error));
    }
  }

  private handleResponse(messageId: number, result: any, error: any) {
    if (!this.requests[messageId]) {
      console.log('unknown message id on response', messageId, result);
      return;
    }

    if (error) {
      this.requests[messageId].reject(new Error(error));
    } else {
      this.requests[messageId].resolve(result);
    }
  }

  async call(name: string, _: Access, args: JSONObject): Promise<JSONValue> {
    await this.ready;

    const messageId = messageIdCounter++;
    const d = this.requests[messageId] = deferred();

    const timeoutId = setTimeout(() => {
      d.reject(new Error('timeout'));
    }, TIMEOUT);

    await this.send({ type: 'request', name, args, messageId });

    try {
      return await d;
    } finally {
      delete this.requests[messageId];
      clearTimeout(timeoutId);
    }
  }

  async send(data: any) {
    if (!this.ws) {
      throw new Error('no ws');
    }

    this.ws.send(JSON.stringify(data));
  }

  subscribe(type: SocketEventType, handler: SocketEventHandler) {
    this.subscribers[type] = this.subscribers[type] || [];
    this.subscribers[type]!.push(handler);

    return () => {
      const index = this.subscribers[type]!.indexOf(handler);
      if (index !== -1) {
        this.subscribers[type]!.splice(index, 1);
      }
    };
  }

  onReady(handler: () => Promise<void>) {
    this.readyHandlers.push(handler);
  }

  async destroy() {
    this.destoyed = true;

    if (!this.ws) {
      return;
    }

    this.ws.close();
  }
}

export const socket = new Socket();
export const ctx: ApiContext = { connection: socket, service: null, access: null as any };

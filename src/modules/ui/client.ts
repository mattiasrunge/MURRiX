import { Access } from '~/src/shared/access/types.ts';
import { ServiceIf } from '~/src/shared/service/types.ts';
import { SocketEvent, SocketEventSessionUpdated, SocketEventType } from './events.ts';

export class Client {
  private service: ServiceIf;
  private ws: WebSocket;
  private access: Access;

  constructor(service: ServiceIf, ws: WebSocket, access: Access) {
    this.service = service;
    this.ws = ws;
    this.access = access;

    ws.onmessage = async (m) => {
      const data = JSON.parse(m.data as string);

      if (data.type === 'request') {
        try {
          const result = await this.service.call(data.name, this.access, data.args);

          ws.send(JSON.stringify({
            type: 'response',
            messageId: data.messageId,
            result,
          }));
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'response',
            messageId: data.messageId,
            error: error.message,
          }));
        }
      } else {
        console.log('Unknown message type', data);
      }
    };
  }

  get sid() {
    return this.access.sid;
  }

  async emit(event: SocketEvent) {
    this.ws.send(JSON.stringify({
      type: 'event',
      event,
    }));
  }

  async sessionUpdated(access: Access) {
    this.access = access;

    await this.emit({
      type: SocketEventType.SocketEventTypeSessionUpdated,
      payload: access,
    } as SocketEventSessionUpdated);
  }

  async open() {
  }

  async destroy() {
  }
}

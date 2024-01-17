import { Deferred, deferred } from 'std/async/deferred.ts';
import { AmqpChannel, AmqpConnection, BasicConsumeOk, BasicDeliver, BasicProperties, connect } from 'amqp';
import { JSONValue } from '~/lib/types.ts';
import { Service } from '~/lib/service/mod.ts';
import { MQConfig, MQPublishOptions } from './types.ts';

export class MQ {
  private service: Service;
  private connection: AmqpConnection;
  private channel: AmqpChannel;
  private subscriptions: BasicConsumeOk[] = [];
  private requests: Record<string, Deferred<JSONValue>> = {};
  private responseQueue = '';

  private constructor(service: Service, connection: AmqpConnection, channel: AmqpChannel) {
    this.service = service;
    this.connection = connection;
    this.channel = channel;
  }

  static async connect(service: Service, config: MQConfig) {
    const connection = await connect(config);
    const channel = await connection.openChannel();

    // Not sure exactly why this is needed, but tests
    // fail if it is not here, maybe the connection
    // and channel needs an async to make it okay.
    await new Promise((res) => setTimeout(res, 0));

    const mq = new MQ(service, connection, channel);
    await mq.consumeResponses();

    return mq;
  }

  private async consumeResponses() {
    const responseQueue = await this.channel.declareQueue({ autoDelete: true });

    await this.channel.consume({
      queue: responseQueue.queue,
      noAck: true,
    }, this.consumeResponse.bind(this));

    this.responseQueue = responseQueue.queue;
  }

  private async consumeResponse(_args: BasicDeliver, props: BasicProperties, encodedData: Uint8Array): Promise<void> {
    // console.log('request-consumer', Date.now() - props.timestamp!);

    if (!props.correlationId) {
      return;
    }

    const data = JSON.parse(new TextDecoder().decode(encodedData));
    const d = this.requests[props.correlationId];

    if (!d) {
      return;
    }

    if (props.type === 'reply-error') {
      const error = new Error(data.message);
      error.stack = data.stack;
      d.reject(error);
    } else if (props.type === 'reply') {
      d.resolve(data);
    } else {
      d.reject(new Error(`invalid response type: ${props.type}`));
    }
  }

  private async publish(data: JSONValue, options: MQPublishOptions) {
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    const messageId = crypto.randomUUID();

    await this.channel.publish({
      exchange: options.exchange,
      routingKey: options.routingKey,
    }, {
      appId: this.service.instanceId,
      contentType: 'application/json',
      contentEncoding: 'utf-8',
      deliveryMode: 2,
      replyTo: options.replyTo,
      correlationId: options.replyId,
      messageId,
      timestamp: Date.now(),
      type: options.type,
    }, encodedData);

    return messageId;
  }

  async request<REQ extends JSONValue, RES extends JSONValue>(name: string, data: REQ, timeout?: number): Promise<RES> {
    // const t = Date.now();
    const options: MQPublishOptions = {
      type: 'request',
      replyTo: this.responseQueue,
      routingKey: name,
    };

    const messageId = await this.publish(data, options);

    const d = this.requests[messageId] = deferred<RES>();

    let timeoutId: number | undefined;

    if (timeout) {
      timeoutId = setTimeout(() => {
        d.reject(new Error('timeout'));
      }, timeout);
    }

    try {
      return await d;
    } finally {
      delete this.requests[messageId];
      clearTimeout(timeoutId);
      // console.log(name, Date.now() - t);
    }
  }

  async requestHandler<REQ extends JSONValue, RES extends JSONValue>(name: string, handler: (data: REQ) => Promise<RES>) {
    const requestQueue = await this.channel.declareQueue({
      queue: name,
      durable: true,
    });

    const consumer = async (args: BasicDeliver, props: BasicProperties, encodedData: Uint8Array) => {
      // console.log('request-handler-consumer', name, Date.now() - props.timestamp!);
      const data = JSON.parse(new TextDecoder().decode(encodedData));

      try {
        const result = await handler(data as REQ);

        const options: MQPublishOptions = {
          type: 'reply',
          routingKey: props.replyTo,
          replyId: props.messageId,
        };

        await this.publish(result, options);
      } catch (error) {
        const options: MQPublishOptions = {
          type: 'reply-error',
          routingKey: props.replyTo,
          replyId: props.messageId,
        };

        await this.publish({
          message: error.message,
          stack: error.stack,
        }, options);
      }

      await this.channel.ack(args);
    };

    const consumeId = await this.channel.consume({
      queue: requestQueue.queue,
    }, consumer);

    this.subscriptions.push(consumeId);

    return async () => {
      await this.channel.cancel(consumeId);
      this.subscriptions = this.subscriptions.filter((id) => id !== consumeId);
      await this.channel.deleteQueue({ queue: requestQueue.queue });
    };
  }

  async clearRequestHandlers() {
    for (const subscription of this.subscriptions) {
      await this.channel.cancel(subscription);
    }

    this.subscriptions = [];
  }

  async close() {
    await this.clearRequestHandlers();
    await this.channel.close();
    await this.connection.close();
  }
}

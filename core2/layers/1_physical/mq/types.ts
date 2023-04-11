import { AmqpConnectOptions } from 'amqp';
import { JSONValue } from '~/layers/0_common/mod.ts';

export type MQConfig = AmqpConnectOptions;

export type MQMessageType = 'request' | 'reply' | 'reply-error' | 'event';

export type MQPublishOptions = {
  exchange?: string;
  routingKey?: string;
  replyId?: string;
  replyTo?: string;
  type: MQMessageType;
};

export type MQEvent = {
  id: string;
  type: 'event';
  data: JSONValue;
};

export type MQRequest = {
  id: string;
  type: 'request';
  data: JSONValue;
  replyTo: string;
};

export type MQReply = {
  replyTo: string;
  type: 'reply';
  data: JSONValue;
};

export type MQRequestHandler = (data: JSONValue) => Promise<JSONValue>;

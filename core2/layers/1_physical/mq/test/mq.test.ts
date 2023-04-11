import { assertEquals, assertRejects } from 'std/testing/asserts.ts';
import { JSONValue } from '~/layers/0_common/types.ts';
import { MQ } from '../mq.ts';

Deno.test({
  name: 'fs',
  fn: async (t) => {
    const config = {
      hostname: 'localhost',
      port: 5672,
    };

    const mqClient = await MQ.connect('client', config);
    const mqServer = await MQ.connect('server', config);

    await t.step('should do a request', async () => {
      let dispose: () => Promise<void> = () => Promise.resolve();
      try {
        dispose = await mqServer.requestHandler<JSONValue, JSONValue>('test', async (data: JSONValue) => {
          return data;
        });

        const response = await mqClient.request<JSONValue, JSONValue>('test', { hello: 'world' });

        assertEquals(response, { hello: 'world' });
      } finally {
        await dispose();
      }
    });

    await t.step('should do a request which returns an error', async () => {
      let dispose: () => Promise<void> = () => Promise.resolve();
      try {
        dispose = await mqServer.requestHandler<JSONValue, JSONValue>('test-error', async (_data: JSONValue) => {
          throw new Error('test-error');
        });

        await assertRejects(
          async () => {
            await mqClient.request<JSONValue, JSONValue>('test-error', { hello: 'world' });
          },
          Error,
          'test-error',
        );
      } finally {
        await dispose();
      }
    });

    await t.step('should request which causes a timeout', async () => {
      let dispose: () => Promise<void> = () => Promise.resolve();
      try {
        dispose = await mqServer.requestHandler<JSONValue, JSONValue>('test-timeout', async (_data: JSONValue) => {
          return new Promise(() => {});
        });

        await assertRejects(
          async () => {
            await mqClient.request<JSONValue, JSONValue>('test-timeout', { hello: 'world' }, 100);
          },
          Error,
          'timeout',
        );
      } finally {
        await dispose();
      }
    });

    await mqServer.close();
    await mqClient.close();
  },
  sanitizeOps: false, // TODO: Investigate why this is needed
  sanitizeResources: false, // TODO: Investigate why this is needed
});

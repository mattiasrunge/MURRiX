import { log } from '../log.ts';

Deno.test({
  name: 'log',
  fn: async (t) => {
    await t.step('should log some messages', async () => {
      log.setName('log.test');

      log.info('an informative message', { hello: 'world' });
      log.info('another informative message', 'hello world');
      log.debug('a debug message', { hello: 'world' });
      log.error('an error message', new Error('Error message'));
    });
  },
});

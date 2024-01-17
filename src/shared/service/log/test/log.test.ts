import { Log } from '../log.ts';

Deno.test({
  name: 'log',
  fn: async (t) => {
    await t.step('should log some messages', async () => {
      const log = new Log('test');

      log.info('an informative message', { hello: 'world' });
      log.info('another informative message', 'hello world');
      log.debug('a debug message', { hello: 'world' });
      log.error('an error message', new Error('Error message'));
    });
  },
});

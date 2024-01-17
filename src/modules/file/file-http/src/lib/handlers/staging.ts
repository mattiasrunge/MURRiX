import { RouterContext } from 'oak';
import { getRequestExtras } from '~/src/lib/http-server.ts';
import { StagingServer } from '~/src/lib/staging-server.ts';

export const handlerStaging = async (context: RouterContext<string>, stagingServer: StagingServer) => {
  const { incomingMessage, serverResponse } = getRequestExtras(context);
  await stagingServer.handle(incomingMessage, serverResponse);
};

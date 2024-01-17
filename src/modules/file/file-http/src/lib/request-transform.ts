import type { IncomingMessage, ServerResponse } from 'node:http';

/*
  Credits to the SvelteKit team
	https://github.com/sveltejs/kit/blob/8d1ba04825a540324bc003e85f36559a594aadc2/packages/kit/src/exports/node/index.js
  Credits to the Astro team
  https://github.com/withastro/astro/blob/2dca81bf2174cd5c27cb63cb0ae081ea2a1ac771/packages/integrations/vercel/src/serverless/request-transform.ts
*/

export async function getRequest(
  base: string,
  req: IncomingMessage,
): Promise<Request> {
  const headers = req.headers as Record<string, string>;
  const request = new Request(base + req.url, {
    // @ts-expect-error Don't know why
    duplex: 'half',
    method: req.method,
    headers,
    body: null,
  });

  return request;
}

export async function setResponse(res: ServerResponse, response: Response): Promise<void> {
  const headers = Object.fromEntries(response.headers);

  res.writeHead(response.status, headers);

  if (!response.body) {
    res.end();
    return;
  }

  if (response.body.locked) {
    res.write(
      'Fatal error: Response body is locked. ' +
        `This can happen when the response was already read (for example through 'response.json()' or 'response.text()').`,
    );
    res.end();
    return;
  }

  const reader = response.body.getReader();

  if (res.destroyed) {
    reader.cancel();
    return;
  }

  const cancel = (error?: Error) => {
    res.off('close', cancel);
    res.off('error', cancel);

    // If the reader has already been interrupted with an error earlier,
    // then it will appear here, it is useless, but it needs to be catch.
    reader.cancel(error).catch(() => {});
    if (error) res.destroy(error);
  };

  res.on('close', cancel);
  res.on('error', cancel);

  next();
  async function next() {
    try {
      for (;;) {
        const { done, value } = await reader.read();

        if (done) break;

        if (!res.write(value)) {
          res.once('drain', next);
          return;
        }
      }
      res.end();
    } catch (error) {
      cancel(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

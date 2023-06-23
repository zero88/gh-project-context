import { matchRequestUrl, MockedRequest, rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer();

const waitForRequest: (url: string, method: string) => Promise<MockedRequest> = (url: string, method: string) => {
  let requestId = '';

  return new Promise<MockedRequest>((resolve, reject) => {
    server.events.on('request:start', (req) => {
      const matchesMethod = req.method.toLowerCase() === method.toLowerCase();
      const matchesUrl = matchRequestUrl(req.url, url).matches;
      if (matchesMethod && matchesUrl) {
        requestId = req.id;
      }
    });
    server.events.on('request:match', (req) => {
      if (req.id === requestId) {
        resolve(req);
      }
    });

    server.events.on('request:unhandled', (req) => {
      if (req.id === requestId) {
        reject(new Error(`The ${req.method} ${req.url.href} request was unhandled.`));
      }
    });

    setTimeout(() => reject(new Error(`Timeout when waiting for request: ${method} ${url} (${requestId})`)), 4000);
  });
};

export { rest, server, waitForRequest };

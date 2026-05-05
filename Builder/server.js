import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const builderFile = join(__dirname, 'webBuilder.html');
const port = Number(process.env.PORT || 4174);
const host = process.env.HOST || '127.0.0.1';

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url || '/', `http://${request.headers.host || `${host}:${port}`}`);

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, {
      Allow: 'GET, HEAD',
      'Content-Type': 'text/plain; charset=utf-8',
    });
    response.end('Method Not Allowed');
    return;
  }

  if (requestUrl.pathname === '/favicon.ico') {
    response.writeHead(204);
    response.end();
    return;
  }

  if (requestUrl.pathname !== '/' && requestUrl.pathname !== '/webBuilder.html') {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not Found');
    return;
  }

  try {
    const html = await readFile(builderFile);
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });

    if (request.method === 'HEAD') {
      response.end();
      return;
    }

    response.end(html);
  } catch (error) {
    console.error(error);
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Unable to load webBuilder.html');
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Try: $env:PORT=${port + 1}; npm.cmd run builder`);
    process.exit(1);
  }

  throw error;
});

server.listen(port, host, () => {
  console.log(`Web builder server running at http://${host}:${port}`);
  console.log('Press Ctrl+C to stop.');
});

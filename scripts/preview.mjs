import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const config = JSON.parse(await readFile('vercel.json', 'utf8'));
const headers = Object.fromEntries(config.headers[0].headers.map(({ key, value }) => [key, value]));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const portIndex = process.argv.indexOf('--port');
const port = portIndex < 0 ? 4173 : Number(process.argv[portIndex + 1]);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid preview port');
await stat(path.join(root, 'index.html'));
const server = http.createServer(async (req, res) => {
  const send = (status, body = '', type = 'text/plain; charset=utf-8') => {
    res.writeHead(status, { ...headers, 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : body);
  };
  if (!['GET', 'HEAD'].includes(req.method)) return send(405, 'Method not allowed');
  let pathname;
  try { pathname = decodeURIComponent(req.url.split('?')[0]); } catch { return send(400, 'Invalid path'); }
  if (pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').some(part => part === '..' || part.startsWith('.'))) return send(403, 'Forbidden');
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) return send(403, 'Forbidden');
  try {
    if (!(await stat(file)).isFile()) return send(404, 'Not found');
    send(200, await readFile(file), types[path.extname(file)] || 'application/octet-stream');
  } catch (error) {
    if (['ENOENT', 'ENOTDIR'].includes(error.code)) return send(404, 'Not found');
    console.error('Preview read failed:', error.code);
    send(500, 'Unable to read file');
  }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${server.address().port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());

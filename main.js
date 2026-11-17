const { program } = require('commander');
const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const superagent = require('superagent');

program
  .helpOption('-H, --help', 'показати довідку')
  .requiredOption('-h, --host <address>', 'адреса сервера')
  .requiredOption('-p, --port <number>', 'порт сервера')
  .requiredOption('-c, --cache <path>', 'шлях до теки з кешем');

program.parse();
const { host, port, cache } = program.opts();

function sendText(res, status, text, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', ...headers });
  res.end(text);
}

function sendImage(res, image, source) {
  res.writeHead(200, { 'Content-Type': 'image/jpeg', 'X-Image-Source': source });
  res.end(image);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function handleGet(res, file, code) {
  try {
    const cached = await fs.readFile(file);
    return sendImage(res, cached, 'cache');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  let image;
  try {
    const response = await superagent
      .get(`https://http.cat/${code}`)
      .buffer(true)
      .parse(superagent.parse.image);
    image = response.body;
  } catch (err) {
    return sendText(res, 404, 'Not Found');
  }

  await fs.writeFile(file, image);
  sendImage(res, image, 'http.cat');
}

async function handlePut(req, res, file) {
  const body = await readBody(req);
  if (body.length === 0) {
    return sendText(res, 400, 'Bad Request: empty body');
  }
  await fs.writeFile(file, body);
  sendText(res, 201, 'Created');
}

async function main() {
  await fs.mkdir(cache, { recursive: true });

  const server = http.createServer(async (req, res) => {
    try {
      const { pathname } = new URL(req.url, 'http://localhost');
      const match = /^\/(\d{3})$/.exec(pathname);
      if (!match) return sendText(res, 404, 'Not Found');

      const code = match[1];
      const file = path.join(cache, `${code}.jpg`);

      switch (req.method) {
        case 'GET':
          return await handleGet(res, file, code);
        case 'PUT':
          return await handlePut(req, res, file);
        default:
          return sendText(res, 405, 'Method Not Allowed', { Allow: 'GET, PUT, DELETE' });
      }
    } catch (err) {
      console.error(err);
      sendText(res, 500, 'Internal Server Error');
    }
  });

  server.listen(Number(port), host, () => {
    console.log(`Сервер: http://${host}:${port}, кеш: ${cache}`);
  });
}

main().catch((err) => {
  console.error('Помилка запуску:', err.message);
  process.exit(1);
});

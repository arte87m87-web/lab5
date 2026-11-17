const { program } = require('commander');
const http = require('http');
const fs = require('fs/promises');

program
  .helpOption('-H, --help', 'показати довідку')
  .requiredOption('-h, --host <host>', 'адреса сервера')
  .requiredOption('-p, --port <port>', 'порт сервера')
  .requiredOption('-c, --cache <path>', 'шлях до теки з кешем');

program.parse();
const { host, port, cache } = program.opts();

async function main() {
  await fs.mkdir(cache, { recursive: true });

  const server = http.createServer(async (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Proxy server is running');
  });

  server.listen(Number(port), host, () => {
    console.log(`Сервер: http://${host}:${port}, кеш: ${cache}`);
  });
}

main().catch((err) => {
  console.error('Помилка запуску:', err.message);
  process.exit(1);
});

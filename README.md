# Кешуючий проксі-сервер на Node.js

Сервер віддає картинки http.cat, кешуючи їх на диску.

## Запуск
npm install
node main.js -h localhost -p 3000 -c ./cache

## Методи
- GET /<код> — картинка з кешу або з http.cat (заголовок X-Image-Source: cache | http.cat), 404 якщо немає
- PUT /<код> — записати тіло запиту в кеш (201), порожнє тіло дає 400
- DELETE /<код> — видалити з кешу (200), 404 якщо немає
- інші методи — 405 із заголовком Allow

Команди curl: test.txt. Колекція Postman: postman/lab5.postman_collection.json

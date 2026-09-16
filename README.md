# learn

REST API на Bun, Express 5, Prisma (PostgreSQL) и Redis. Access-токен в JWT, refresh-токен в Redis и httpOnly-cookie. Слои: `domain`, `application`, `infrastructure`, `presentation`.

## Стек

- Runtime: [Bun](https://bun.com)
- HTTP: Express 5, helmet, cors, cookie-parser, express-rate-limit
- ORM: Prisma 6, PostgreSQL
- Redis: хранение и ротация refresh-токенов
- Auth: JWT (`jsonwebtoken`), пароли через bcrypt
- Валидация: Zod 4
- Документация: swagger-jsdoc + swagger-ui-express
- Язык: TypeScript 5
- Тулинг: ESLint, Prettier

## Архитектура

```
src/
├── domain/              # сущности и сервисы, без Express/Prisma/Redis
│   ├── entities/
│   └── services/        # AuthService, PostService
├── application/         # DTO и порты
│   ├── dtos/
│   └── ports/
├── infrastructure/      # реализации портов
│   ├── db/              # Prisma, Redis, репозитории
│   └── services/        # BcryptHashService, TokenService
├── presentation/        # HTTP
│   ├── controllers/
│   ├── http/            # Zod-схемы запросов, swagger definition
│   ├── middlewares/     # auth, validate, rate-limit, errors
│   ├── routes/          # ручки и JSDoc @openapi
│   └── app.ts           # DI, middleware, /docs
├── config/
├── shared/              # AppError
├── types/
└── server.ts            # listen + graceful shutdown
```

Зависимости направлены внутрь: `presentation` вызывает `domain`, `domain` зависит от портов в `application`, `infrastructure` реализует порты.

## Требования

- [Bun](https://bun.com) 1.3+
- Docker (PostgreSQL и Redis) либо локальные Postgres и Redis

## Установка

```bash
bun install
```

## Переменные окружения

Создай `.env` в корне:

```env
PORT=3000

POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=learn
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/learn"

REDIS_URL="redis://localhost:6379"

JWT_ACCESS_SECRET="change_me_access"
JWT_REFRESH_SECRET="change_me_refresh"
```

`JWT_ACCESS_SECRET` и `JWT_REFRESH_SECRET` должны быть длинными случайными строками.

## Запуск инфраструктуры

```bash
docker compose up -d
```

Compose поднимает Postgres 16 на `5432` и Redis 7 на `6379`.

Миграции и клиент Prisma:

```bash
bunx prisma migrate deploy
bunx prisma generate
```

Для разработки схемы: `bunx prisma migrate dev`.

## Запуск приложения

```bash
bun run dev
```

Сервер слушает `http://localhost:3000` (или `PORT`). При старте `createApp()` коннектится к Prisma и Redis. `SIGINT` / `SIGTERM` закрывают HTTP, Redis и Prisma.

Swagger UI: `http://localhost:3000/docs`. Спека собирается при старте: `swagger-jsdoc` читает `src/presentation/routes/*.ts` (блоки `@openapi`) и мержит их с компонентами из `src/presentation/http/swagger.ts`.

CORS разрешён для `http://localhost:5173` с `credentials: true`.

## Скрипты

| Команда                | Что делает                |
| ---------------------- | ------------------------- |
| `bun run dev`          | Watch-режим               |
| `bun run lint`         | ESLint                    |
| `bun run lint:fix`     | ESLint с автоисправлением |
| `bun run format`       | Prettier                  |
| `bun run format:check` | Проверка форматирования   |

Типы: `bunx tsc --noEmit`.

## API

Базовый префикс `/api`. Полные схемы, примеры и Try it out в `/docs`.

### Auth (`/api/auth`)

| Метод | Путь        | Тело                  | Ответ                                              |
| ----- | ----------- | --------------------- | -------------------------------------------------- |
| POST  | `/register` | `{ email, password }` | 201 `{ accessToken, user }`, cookie `refreshToken` |
| POST  | `/login`    | `{ email, password }` | 201 `{ accessToken, user }`, cookie `refreshToken` |
| POST  | `/refresh`  | `{ refreshToken }`    | 201 `{ accessToken }`, cookie обновляется          |
| POST  | `/logout`   | cookie `refreshToken` | 204, cookie сбрасывается                           |

Пароль: 10–50 символов. Email должен быть валидным.

Cookie `refreshToken`: httpOnly, SameSite=Lax, Path=`/auth`, 7 дней. `Secure` только при `NODE_ENV=production`.

Лимиты (окно 10 минут): register 10, login 10, refresh 20 запросов с одного IP.

Access-токен: `Authorization: Bearer <accessToken>`, TTL 15 минут.

Refresh в Redis: ключи `refresh_token:<user_id>:<jti>` и `family:<user_id>:<familyId>`, TTL 7 дней. Ротация выдаёт новый jti в той же family. Повторное использование старого токена (не grace) гасит family.

### Posts (`/api/posts`)

| Метод  | Путь   | Auth   | Тело                | Ответ               |
| ------ | ------ | ------ | ------------------- | ------------------- |
| GET    | `/`    | нет    | —                   | 200 массив постов   |
| GET    | `/:id` | нет    | —                   | 200 пост или `null` |
| POST   | `/`    | Bearer | `{ title, text }`   | 201 пост            |
| PATCH  | `/:id` | Bearer | `{ title?, text? }` | 200 пост            |
| DELETE | `/:id` | Bearer | —                   | 204                 |

`id` в пути: UUID. Title: 5–100 символов. Text: 90–1000. PATCH принимает любое поле опционально.

Обновить и удалить может только автор (403). Нет поста: 404.

## Ошибки

Валидация body/params (Zod, middleware `validate`):

```json
{ "error": "validation", "details": [{ "path": "body.email", "message": "Invalid email" }] }
```

Ошибки домена (`AppError`): `{ "message": "..." }` и соответствующий статус (400, 401, 403, 404). Остальное: 500 `{ "message": "Internal server error" }`.

## Что ещё нет

- Тесты

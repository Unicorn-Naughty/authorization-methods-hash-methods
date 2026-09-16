# learn

REST API на Bun, Express 5, Prisma (PostgreSQL) и Redis. Access-токен в JWT, refresh-токен в Redis и httpOnly-cookie. Слои: `domain`, `application`, `infrastructure`, `presentation`.

## Стек

- Runtime: [Bun](https://bun.com)
- HTTP: Express 5, helmet, cors, cookie-parser, express-rate-limit
- ORM: Prisma 6, PostgreSQL
- Redis: refresh-токены и OAuth state
- Auth: JWT (`jsonwebtoken`), пароли через bcrypt, GitHub OAuth (PKCE)
- Валидация: Zod 4
- Документация: swagger-jsdoc + swagger-ui-express
- Язык: TypeScript 5
- Тулинг: ESLint, Prettier

## Архитектура

```
src/
├── domain/              # сущности и сервисы, без Express/Prisma/Redis
│   ├── entities/
│   └── services/        # AuthService, OauthService, PostService
├── application/         # DTO и порты
│   ├── dtos/
│   └── ports/
├── infrastructure/      # реализации портов
│   ├── db/              # Prisma, Redis, репозитории user/post/account
│   └── services/        # BcryptHashService, TokenService, GithubOauthService
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

GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GITHUB_CALLBACK_URL="http://localhost:3000/api/auth/oauth/github/callback"
```

`JWT_ACCESS_SECRET` и `JWT_REFRESH_SECRET` должны быть длинными случайными строками.

Для GitHub OAuth создай приложение с callback `GITHUB_CALLBACK_URL`. Scope: `read:user user:email`.

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

| Метод | Путь                     | Тело                  | Ответ                                              |
| ----- | ------------------------ | --------------------- | -------------------------------------------------- |
| POST  | `/register`              | `{ email, password }` | 201 `{ accessToken, user }`, cookie `refreshToken` |
| POST  | `/login`                 | `{ email, password }` | 201 `{ accessToken, user }`, cookie `refreshToken` |
| POST  | `/refresh`               | `{ refreshToken }`    | 201 `{ accessToken }`, cookie обновляется          |
| POST  | `/logout`                | cookie `refreshToken` | 204, cookie сбрасывается                           |
| GET   | `/oauth/github/login`    | —                     | 302 на GitHub authorize                            |
| GET   | `/oauth/github/callback` | query `code`, `state` | 201 `{ accessToken, user }`, cookie `refreshToken` |

Пароль: 10–50 символов. Email должен быть валидным. У пользователя, созданного через OAuth, пароля нет (`password` в Prisma опционален).

Cookie `refreshToken`: httpOnly, SameSite=Lax, Path=`/auth`, 7 дней. `Secure` только при `NODE_ENV=production`.

Лимиты (окно 10 минут): register 10, login 10, refresh 20, GitHub OAuth login 10, callback 10 запросов с одного IP.

Access-токен: `Authorization: Bearer <accessToken>`, TTL 15 минут.

Refresh в Redis: ключи `refresh_token:<user_id>:<jti>` и `family:<user_id>:<familyId>`, TTL 7 дней. Ротация выдаёт новый jti в той же family. Повторное использование старого токена (не grace) гасит family.

GitHub OAuth идёт через PKCE S256. `GET /oauth/github/login` кладёт `code_verifier` в Redis по `state` на 10 минут и редиректит на GitHub. Callback забирает verifier через `GETDEL`, обменивает `code` на аккаунт GitHub и выдаёт токены.

Если пара `(provider, provider_account_id)` уже есть, логинится этот пользователь. Если нет, ищется user по email GitHub: найденный линкуется через `Account`, иначе создаётся новый user без пароля. Email берётся из профиля, иначе из `/user/emails` (primary и verified, иначе любой verified). Без email ответ 400. Невалидный `state` или отказ GitHub: 401.

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

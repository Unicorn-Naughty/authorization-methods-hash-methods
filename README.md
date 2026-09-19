# learn

REST API на Bun, Express 5, Prisma (PostgreSQL) и Redis. Access-токен в JWT, refresh-токен в Redis и httpOnly-cookie. Слои: `domain`, `application`, `infrastructure`, `presentation`.

## Стек

- Runtime: [Bun](https://bun.com)
- HTTP: Express 5, HTTPS, helmet, cors, cookie-parser, express-rate-limit
- ORM: Prisma 6, PostgreSQL
- Redis: refresh-токены и OAuth state
- Auth: JWT (`jsonwebtoken`), пароли через bcrypt, OAuth VK / GitHub / Google (PKCE S256)
- Валидация: Zod 4
- Документация: swagger-jsdoc + swagger-ui-express
- Язык: TypeScript 5
- Тулинг: ESLint, Prettier

## Архитектура

```
src/
├── domain/
│   ├── entities/
│   ├── errors/          # AppError
│   ├── services/        # AuthService, OauthService, PostService
│   └── utils/
├── application/         # DTO и порты
│   ├── dtos/
│   └── ports/
├── infrastructure/      # реализации портов
│   ├── db/              # Prisma, Redis, репозитории, unit of work
│   └── services/        # hash, JWT, OAuth-адаптеры, session store
├── presentation/        # HTTP
│   ├── controllers/
│   ├── http/            # Zod-схемы, swagger definition
│   ├── middlewares/     # auth, csrf, validate, rate-limit, errors
│   ├── routes/          # ручки и JSDoc @openapi
│   └── app.ts           # DI, middleware, /docs
├── config/
├── types/
└── server.ts            # HTTPS listen + graceful shutdown
```

`presentation` вызывает `domain`. `domain` зависит от портов в `application`. `infrastructure` реализует порты.

## Требования

- [Bun](https://bun.com) 1.3+
- Docker (PostgreSQL и Redis) либо локальные Postgres и Redis
- OpenSSL (или Git for Windows) для генерации локального TLS-серта

## Установка

```bash
bun install
```

## Переменные окружения

Создай `.env` в корне. JWT-секреты и OAuth-креды обязательны. Без них процесс не стартует.

```env
PORT=3000

POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=learn
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/learn"

REDIS_URL="redis://localhost:6379"

JWT_ACCESS_SECRET="change_me_access"
JWT_REFRESH_SECRET="change_me_refresh"

CORS_ORIGINS="http://localhost:5173,https://localhost:5173"

GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GITHUB_CALLBACK_URL="https://localhost:3000/api/auth/oauth/callback"

VK_ID=""
VK_SERVICE_KEY=""
VK_CALLBACK_URL="https://localhost:3000/api/auth/oauth/callback"

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_CALLBACK_URL="https://localhost:3000/api/auth/oauth/callback"
```

`JWT_ACCESS_SECRET` и `JWT_REFRESH_SECRET` должны быть длинными случайными строками.

Callback URL у всех трёх провайдеров один: `/api/auth/oauth/callback`. В консоли провайдера укажи тот же URL, что в env.

- GitHub: scope `read:user user:email`
- VK: scope `email`
- Google: `openid email profile`

`CORS_ORIGINS` необязателен. По умолчанию `http://localhost:5173` и `https://localhost:5173`. Список через запятую.

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

Сервер слушает `https://localhost:3000` (или `PORT`). При первом старте, если нет файлов в `certs/`, генерируется self-signed сертификат на localhost.

`createApp()` коннектится к Prisma и Redis. `SIGINT` / `SIGTERM` дожидаются закрытия HTTP, затем Redis и Prisma.

Swagger UI: `https://localhost:3000/docs`. Спека собирается при старте: `swagger-jsdoc` читает `src/presentation/routes/*.ts` и мержит с компонентами из `src/presentation/http/swagger.ts`.

CORS разрешён для origin из `CORS_ORIGINS` с `credentials: true`.

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

Базовый префикс `/api`. Полные схемы и Try it out в `/docs`.

### Auth (`/api/auth`)

| Метод | Путь              | Вход                                      | Ответ                                              |
| ----- | ----------------- | ----------------------------------------- | -------------------------------------------------- |
| POST  | `/register`       | `{ email, password }`                     | 201 `{ accessToken, user }`, cookie `refreshToken` |
| POST  | `/login`          | `{ email, password }`                     | 200 `{ accessToken, user }`, cookie `refreshToken` |
| POST  | `/refresh`        | cookie `refreshToken`                     | 200 `{ accessToken }`, cookie обновляется          |
| POST  | `/logout`         | cookie `refreshToken`                     | 204, cookie сбрасывается                           |
| GET   | `/oauth/login`    | query `provider` (`vk` / `github` / `google`) | 302 на authorize провайдера                    |
| GET   | `/oauth/callback` | query `code`, `state`                     | 201 `{ accessToken, user }`, cookie `refreshToken` |

Пароль: 10-50 символов. Email валидируется Zod и перед записью приводится к нижнему регистру. У пользователя, созданного через OAuth, пароля нет.

Cookie `refreshToken`: httpOnly, Secure, SameSite=None, Path=`/api/auth`, 7 дней.

`POST /refresh` и `POST /logout` проверяют `Origin` (если нет, `Referer`) по списку `CORS_ORIGINS`. Чужая origin даёт 403.

Лимиты, окно 10 минут, с одного IP: register 10, login 10, refresh 20, logout 20, OAuth login 10, OAuth callback 10.

Access-токен: `Authorization: Bearer <accessToken>`, TTL 15 минут, алгоритм HS256.

Refresh в Redis: ключи `refresh_token:<user_id>:<jti>` и `family:<user_id>:<familyId>`, TTL 7 дней. Ротация выдаёт новый jti в той же family. Повторное использование старого токена (не grace-окно 10 секунд) гасит family.

OAuth идёт через PKCE S256. `GET /oauth/login` кладёт `provider` и `code_verifier` в Redis по `state` на 10 минут и редиректит. Callback забирает сессию через `GETDEL`, обменивает `code` на аккаунт и выдаёт токены. Создание user и account в одной транзакции.

Для VK в query могут быть `device_id` и `payload` (JSON с `code`, `state`, `device_id`).

Если пара `(provider, provider_account_id)` уже есть, логинится этот пользователь. Если нет, ищется user по email: найденный линкуется через `Account`, иначе создаётся user без пароля. Email только verified. GitHub берёт его из `/user/emails` (primary+verified, иначе verified). Без verified email ответ 400. Невалидный `state` или отказ провайдера: 401.

### Posts (`/api/posts`)

| Метод  | Путь   | Auth   | Вход                         | Ответ                                      |
| ------ | ------ | ------ | ---------------------------- | ------------------------------------------ |
| GET    | `/`    | нет    | query `page`, `limit`        | 200 `{ items, page, limit, total, pages }` |
| GET    | `/:id` | нет    | —                            | 200 пост                                   |
| POST   | `/`    | Bearer | `{ title, text }`            | 201 пост                                   |
| PATCH  | `/:id` | Bearer | `{ title? }`, `{ text? }`    | 200 пост                                   |
| DELETE | `/:id` | Bearer | —                            | 204                                        |

`id` в пути: UUID. Title: 5-100 символов. Text: 90-1000. PATCH требует хотя бы одно поле.

Список: `page` с 1, `limit` 1-100, по умолчанию `page=1`, `limit=20`. Сортировка по `created_at` desc. `pages` это `ceil(total / limit)`.

Обновить и удалить может только автор (403). Нет поста: 404.

## Ошибки

Валидация body/params/query (Zod):

```json
{
  "message": "validation error",
  "details": [{ "path": "body.email", "message": "Invalid email" }]
}
```

Ошибки домена (`AppError`): `{ "message": "..." }` и статус 400, 401, 403, 404, 409, 502. Остальное: 500 `{ "message": "Internal server error" }`.

## Что ещё нет

- Тесты

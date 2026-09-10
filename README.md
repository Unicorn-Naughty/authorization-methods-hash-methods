# learn

REST API на **Bun + Express + Prisma (PostgreSQL) + Redis** с JWT-аутентификацией (access/refresh токены). Проект построен по принципам чистой архитектуры со слоями `domain / application / infrastructure / presentation`.

## Стек

- **Runtime:** [Bun](https://bun.com)
- **HTTP:** Express 5
- **ORM:** Prisma 6 (PostgreSQL)
- **Кэш/сессии:** Redis (хранение refresh-токенов)
- **Auth:** JWT (`jsonwebtoken`) + хеширование паролей (`bcrypt`)
- **Язык:** TypeScript 5
- **Тулинг:** ESLint + Prettier

## Архитектура

```
src/
├── domain/           # Сущности и бизнес-логика (services), не зависит от фреймворков
│   ├── entities/
│   └── services/     # AuthService, PostService
├── application/      # Контракты приложения
│   ├── dtos/         # Формы входных/выходных данных
│   └── ports/        # Интерфейсы репозиториев и сервисов (порты)
├── infrastructure/   # Реализации портов (адаптеры)
│   ├── db/           # Prisma-клиент, Redis-клиент, репозитории
│   └── services/     # BcryptHashService, TokenService
├── presentation/     # HTTP-слой
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   └── app.ts        # Сборка приложения (DI) + подключение Prisma/Redis
├── config/           # Чтение переменных окружения
├── shared/           # Общие утилиты (AppError и т.п.)
├── types/            # Расширения типов (Express.Request)
└── server.ts         # Точка входа: старт сервера + graceful shutdown
```

Зависимости идут внутрь: `presentation → domain → application (ports)`, а `infrastructure` реализует порты. Домен не знает о Prisma, Express или Redis.

## Требования

- [Bun](https://bun.com) 1.3+
- Docker (для PostgreSQL и Redis) либо локально установленные Postgres и Redis

## Установка

```bash
bun install
```

## Переменные окружения

Создай файл `.env` в корне проекта:

```env
# App
PORT=3000

# PostgreSQL (используется docker-compose и Prisma)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=learn
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/learn"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT (задай длинные случайные строки)
JWT_ACCESS_SECRET="change_me_access"
JWT_REFRESH_SECRET="change_me_refresh"
```

## Запуск инфраструктуры

Поднять PostgreSQL и Redis через Docker:

```bash
docker compose up -d
```

Применить миграции Prisma и сгенерировать клиент:

```bash
bunx prisma migrate deploy   # применить существующие миграции
bunx prisma generate         # сгенерировать Prisma Client
```

Для локальной разработки со схемой можно использовать `bunx prisma migrate dev`.

## Запуск приложения

```bash
bun run dev
```

Сервер стартует на `http://localhost:3000` (или на порту из `PORT`). Prisma и Redis подключаются при старте в `createApp()`, при получении `SIGINT`/`SIGTERM` соединения корректно закрываются.

## Скрипты

| Команда                | Описание                |
| ---------------------- | ----------------------- |
| `bun run dev`          | Запуск в режиме watch   |
| `bun run lint`         | Проверка ESLint         |
| `bun run lint:fix`     | Автоисправление ESLint  |
| `bun run format`       | Форматирование Prettier |
| `bun run format:check` | Проверка форматирования |

Проверка типов:

```bash
bunx tsc --noEmit
```

## API

Базовый префикс — `/api`.

### Auth (`/api/auth`)

| Метод | Путь        | Тело                  | Описание                                                      |
| ----- | ----------- | --------------------- | ------------------------------------------------------------- |
| POST  | `/register` | `{ email, password }` | Регистрация, возвращает `{ accessToken, refreshToken, user }` |
| POST  | `/login`    | `{ email, password }` | Вход, возвращает пару токенов и `user`                        |
| POST  | `/refresh`  | `{ refreshToken }`    | Обновление пары токенов                                       |
| POST  | `/logout`   | `{ refreshToken }`    | Отзыв refresh-токена (204)                                    |

### Posts (`/api/posts`)

| Метод  | Путь   | Auth | Тело              | Описание           |
| ------ | ------ | ---- | ----------------- | ------------------ |
| GET    | `/`    | —    | —                 | Список постов      |
| GET    | `/:id` | —    | —                 | Пост по id         |
| POST   | `/`    | ✅   | `{ title, text }` | Создать пост       |
| PATCH  | `/:id` | ✅   | `{ title, text }` | Обновить свой пост |
| DELETE | `/:id` | ✅   | —                 | Удалить свой пост  |

Защищённые эндпоинты требуют заголовок:

```
Authorization: Bearer <accessToken>
```

Access-токен живёт 15 минут, refresh — 7 дней (хранится в Redis по ключу `refresh_token:<userId>`).

## Планы

- [ ] Валидация входных данных (zod)
- [ ] Тесты
- [ ] Swagger / OpenAPI-документация

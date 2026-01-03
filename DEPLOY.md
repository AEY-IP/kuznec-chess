# 🚀 Инструкция по деплою шахматного турнира

## Вариант 1: Vercel + Vercel Postgres (Рекомендуется)

### Шаг 1: Создать аккаунт на Vercel
1. Перейти на [vercel.com](https://vercel.com)
2. Зарегистрироваться через GitHub

### Шаг 2: Подключить БД Vercel Postgres
1. В проекте Vercel перейти в **Storage** → **Create Database**
2. Выбрать **Postgres**
3. Скопировать строку подключения `DATABASE_URL`
4. Добавить в **Environment Variables** проекта

### Шаг 3: Деплой
```bash
# Установить Vercel CLI
npm i -g vercel

# Залогиниться
vercel login

# Задеплоить
vercel --prod
```

### Шаг 4: Применить миграции БД
```bash
# После деплоя выполнить миграцию
npx prisma migrate deploy
```

---

## Вариант 2: Vercel + Supabase (Бесплатно)

### Шаг 1: Создать БД на Supabase
1. Перейти на [supabase.com](https://supabase.com)
2. Создать новый проект
3. Скопировать **Connection String** (postgres://)

### Шаг 2: Настроить переменные окружения
В Vercel добавить:
```
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"
```

### Шаг 3: Применить миграции
```bash
npx prisma migrate deploy
```

---

## Вариант 3: Railway (Альтернатива)

1. Перейти на [railway.app](https://railway.app)
2. Создать проект → добавить PostgreSQL
3. Скопировать `DATABASE_URL`
4. Добавить в переменные окружения

---

## Локальная разработка с БД

### Вариант A: Docker (быстро)
```bash
# Запустить PostgreSQL в Docker
docker run --name postgres-chess -e POSTGRES_PASSWORD=chess123 -e POSTGRES_DB=chess_tournament -p 5432:5432 -d postgres:16

# В .env добавить:
DATABASE_URL="postgresql://postgres:chess123@localhost:5432/chess_tournament?schema=public"

# Применить миграции
npx prisma migrate dev --name init

# Сгенерировать Prisma Client
npx prisma generate
```

### Вариант B: Установить PostgreSQL локально
```bash
# macOS (Homebrew)
brew install postgresql@16
brew services start postgresql@16

# Создать БД
createdb chess_tournament

# В .env добавить:
DATABASE_URL="postgresql://$(whoami)@localhost:5432/chess_tournament?schema=public"

# Применить миграции
npx prisma migrate dev --name init
```

---

## После настройки БД

### 1. Создать миграцию
```bash
npx prisma migrate dev --name init
```

### 2. Сгенерировать Prisma Client
```bash
npx prisma generate
```

### 3. (Опционально) Заполнить тестовыми данными
```bash
npx prisma db seed
```

### 4. Запустить сервер
```bash
npm run dev
```

---

## Полезные команды Prisma

```bash
# Посмотреть БД в браузере
npx prisma studio

# Применить изменения схемы к БД
npx prisma db push

# Создать миграцию
npx prisma migrate dev --name название_миграции

# Сбросить БД (ОСТОРОЖНО!)
npx prisma migrate reset
```

---

## Переменные окружения для продакшена

Добавить в Vercel / Railway:

```env
DATABASE_URL="postgresql://..."
NODE_ENV="production"
```

---

## Мониторинг

- **Vercel Postgres**: встроенная панель в Vercel Dashboard
- **Supabase**: Table Editor + SQL Editor в панели Supabase
- **Prisma Studio**: `npx prisma studio` (локально)

---

## Безопасность

✅ `.env` добавлен в `.gitignore`
✅ Используется Connection Pooling (Prisma автоматически)
✅ Все запросы параметризованы (защита от SQL injection)

---

## Стоимость

- **Vercel Postgres**: $0.25/месяц (минимум), первые 60ч бесплатно
- **Supabase**: 500 МБ БД бесплатно навсегда
- **Railway**: $5 кредитов/месяц бесплатно

Для турнира на 8 человек любой вариант **бесплатный** 🎉


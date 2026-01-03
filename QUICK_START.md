# 🚀 Быстрый старт

## Вариант 1: Без базы данных (для теста)

```bash
npm install
npm run dev
```

Открыть http://localhost:3000

✅ Работает сразу, данные в памяти
❌ Все результаты исчезнут при перезапуске

---

## Вариант 2: С базой данных (рекомендуется для деплоя)

### Шаг 1: Запустить PostgreSQL в Docker

```bash
docker run --name postgres-chess \
  -e POSTGRES_PASSWORD=chess123 \
  -e POSTGRES_DB=chess_tournament \
  -p 5432:5432 \
  -d postgres:16
```

### Шаг 2: Настроить .env

```bash
# Создать файл .env
echo 'DATABASE_URL="postgresql://postgres:chess123@localhost:5432/chess_tournament"' > .env
```

### Шаг 3: Применить миграции

```bash
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run db:seed
```

### Шаг 4: Запустить

```bash
npm run dev
```

Открыть http://localhost:3000

✅ Данные сохраняются в PostgreSQL
✅ Готово к деплою на Vercel/Railway

---

## Деплой на Vercel (за 5 минут)

### 1. Установить Vercel CLI

```bash
npm i -g vercel
```

### 2. Залогиниться

```bash
vercel login
```

### 3. Создать PostgreSQL БД в Vercel

1. Перейти в [vercel.com](https://vercel.com)
2. Создать проект → **Storage** → **Create Database** → **Postgres**
3. Скопировать `DATABASE_URL`

### 4. Задеплоить

```bash
vercel --prod
```

### 5. Применить миграции

```bash
npx prisma migrate deploy
npm run db:seed
```

Готово! 🎉

---

## Альтернатива: Supabase (бесплатно)

1. Создать проект на [supabase.com](https://supabase.com)
2. Скопировать **Connection String** (postgres://)
3. Добавить в Vercel Environment Variables:
   ```
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres"
   ```
4. Деплой: `vercel --prod`
5. Миграции: `npx prisma migrate deploy`

---

## Полезные команды

```bash
npm run dev          # Запуск локально
npm run build        # Сборка
npm run db:studio    # Открыть БД в браузере
npm run db:seed      # Заполнить тестовыми данными
```

## Тестовые аккаунты

- nickolay@chess.com
- sergey@chess.com
- elizabeth@chess.com
- pavel@chess.com
- roman@chess.com
- polina@chess.com
- alexander@chess.com
- alexey@chess.com

---

## Troubleshooting

### Ошибка подключения к БД

```bash
# Проверить, что Docker контейнер запущен
docker ps

# Перезапустить контейнер
docker start postgres-chess

# Проверить логи
docker logs postgres-chess
```

### Ошибка миграции

```bash
# Сбросить БД (ОСТОРОЖНО!)
npx prisma migrate reset

# Применить миграции заново
npx prisma migrate dev --name init
```

### "Module not found: Can't resolve '@prisma/client'"

```bash
npx prisma generate
```

---

Нужна помощь? Открой [DEPLOY.md](./DEPLOY.md) для подробной инструкции.


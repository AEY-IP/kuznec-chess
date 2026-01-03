import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Начинаем заполнение БД тестовыми данными...')

  // Создаем пользователей БЕЗ никнеймов (будут выбирать при первом входе)
  const users = [
    { id: 'user-1', email: 'nickolay@chess.com', username: 'Nickolay', nickname: null, role: 'user' },
    { id: 'user-2', email: 'sergey@chess.com', username: 'Sergey', nickname: null, role: 'user' },
    { id: 'user-3', email: 'elizabeth@chess.com', username: 'Elizabeth', nickname: null, role: 'user' },
    { id: 'user-4', email: 'pavel@chess.com', username: 'Pavel', nickname: null, role: 'user' },
    { id: 'user-5', email: 'roman@chess.com', username: 'Roman', nickname: null, role: 'user' },
    { id: 'user-6', email: 'polina@chess.com', username: 'Polina', nickname: null, role: 'user' },
    { id: 'user-7', email: 'alexander@chess.com', username: 'Alexander', nickname: null, role: 'user' },
    { id: 'user-8', email: 'alexey@chess.com', username: 'Alexey', nickname: null, role: 'user' },
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    })
  }

  console.log('✅ Пользователи созданы')

  // НЕ создаем турнир - пользователи начинают с чистого листа
  console.log('ℹ️  Турнир не создан - начинайте с чистого листа')

  console.log('🎉 Готово!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })


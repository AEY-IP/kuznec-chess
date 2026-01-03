import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Начинаем заполнение БД тестовыми данными...')

  // Создаем пользователей
  const users = [
    { id: 'user-1', email: 'nickolay@chess.com', username: 'Nickolay', nickname: 'Nickolay', role: 'user' },
    { id: 'user-2', email: 'sergey@chess.com', username: 'Sergey', nickname: 'Sergey', role: 'user' },
    { id: 'user-3', email: 'elizabeth@chess.com', username: 'Elizabeth', nickname: 'Elizabeth', role: 'user' },
    { id: 'user-4', email: 'pavel@chess.com', username: 'Pavel', nickname: 'Pavel', role: 'user' },
    { id: 'user-5', email: 'roman@chess.com', username: 'Roman', nickname: 'Roman', role: 'user' },
    { id: 'user-6', email: 'polina@chess.com', username: 'Polina', nickname: 'Polina', role: 'user' },
    { id: 'user-7', email: 'alexander@chess.com', username: 'Alexander', nickname: 'Alexander', role: 'user' },
    { id: 'user-8', email: 'alexey@chess.com', username: 'Alexey', nickname: 'Alexey', role: 'user' },
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    })
  }

  console.log('✅ Пользователи созданы')

  // Создаем турнир
  const existingTournament = await prisma.tournament.findFirst()
  
  if (!existingTournament) {
    await prisma.tournament.create({
      data: {
        id: 'tournament-1',
        name: 'Шахматный турнир 2026',
        participantIds: users.map(u => u.id),
        stage: 'group',
        groupStageCompleted: false,
        winnersRoundStarted: false,
        finalStageStarted: false,
      }
    })
    console.log('✅ Турнир создан')
  } else {
    console.log('ℹ️  Турнир уже существует')
  }

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


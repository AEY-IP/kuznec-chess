/**
 * Адаптер для работы с БД
 * Автоматически переключается между Prisma (если есть DATABASE_URL) и in-memory storage
 */

import { User, Tournament, Match } from '@/types'

// Проверяем наличие DATABASE_URL
const hasDatabaseUrl = process.env.DATABASE_URL && process.env.DATABASE_URL !== 'postgresql://user:password@localhost:5432/chess_tournament?schema=public'

// Динамический импорт Prisma только если есть DATABASE_URL
let prisma: any = null
if (hasDatabaseUrl) {
  try {
    const { prisma: prismaClient } = require('./prisma')
    prisma = prismaClient
    console.log('✅ Используется PostgreSQL через Prisma')
  } catch (e) {
    console.warn('⚠️ Prisma не настроен, используется in-memory storage')
  }
}

// Если нет Prisma, используем старый in-memory storage
if (!prisma) {
  const { storage } = require('./storage')
  console.log('💾 Используется in-memory storage (данные не сохраняются при перезапуске)')
  
  // Экспортируем методы in-memory storage
  module.exports = {
    // Users
    getUser: storage.getUser.bind(storage),
    getUserByEmail: storage.getUserByEmail.bind(storage),
    getAllUsers: storage.getAllUsers.bind(storage),
    createUser: storage.createUser.bind(storage),
    updateUser: storage.updateUser.bind(storage),
    
    // Tournament
    getTournament: storage.getTournament.bind(storage),
    createTournament: storage.createTournament.bind(storage),
    updateTournament: storage.updateTournament.bind(storage),
    
    // Matches
    getMatch: storage.getMatch.bind(storage),
    updateMatch: storage.updateMatch.bind(storage),
    
    // Init
    initializeTestData: storage.initializeTestData.bind(storage),
  }
} else {
  // Экспортируем методы Prisma adapter
  module.exports = {
    // Users
    getUser: async (id: string): Promise<User | undefined> => {
      const user = await prisma.user.findUnique({ where: { id } })
      return user ? user as User : undefined
    },
    
    getUserByEmail: async (email: string): Promise<User | undefined> => {
      const user = await prisma.user.findUnique({ where: { email } })
      return user ? user as User : undefined
    },
    
    getAllUsers: async (): Promise<User[]> => {
      return await prisma.user.findMany() as User[]
    },
    
    createUser: async (user: User): Promise<User> => {
      return await prisma.user.create({ data: user }) as User
    },
    
    updateUser: async (user: User): Promise<User> => {
      return await prisma.user.update({
        where: { id: user.id },
        data: user
      }) as User
    },
    
    // Tournament
    getTournament: async (id: string): Promise<Tournament | undefined> => {
      const tournament = await prisma.tournament.findUnique({
        where: { id },
        include: { matches: true }
      })
      
      if (!tournament) return undefined
      
      // Конвертируем в наш формат
      return {
        ...tournament,
        matches: tournament.matches.map((m: any) => ({
          ...m,
          result: m.result as any,
          createdAt: new Date(m.createdAt),
          updatedAt: new Date(m.updatedAt),
        }))
      } as Tournament
    },
    
    createTournament: async (tournament: Tournament): Promise<Tournament> => {
      const { matches, ...tournamentData } = tournament
      
      const created = await prisma.tournament.create({
        data: {
          ...tournamentData,
          matches: {
            create: matches.map(m => ({
              id: m.id,
              player1Id: m.player1Id,
              player1Name: m.player1Name,
              player2Id: m.player2Id,
              player2Name: m.player2Name,
              stage: m.stage,
              round: m.round,
              status: m.status,
              result: m.result as any,
            }))
          }
        },
        include: { matches: true }
      })
      
      return {
        ...created,
        matches: created.matches.map((m: any) => ({
          ...m,
          result: m.result as any,
          createdAt: new Date(m.createdAt),
          updatedAt: new Date(m.updatedAt),
        }))
      } as Tournament
    },
    
    updateTournament: async (tournament: Tournament): Promise<void> => {
      const { matches, ...tournamentData } = tournament
      
      await prisma.tournament.update({
        where: { id: tournament.id },
        data: tournamentData
      })
      
      // Обновляем матчи отдельно
      for (const match of matches) {
        await prisma.match.upsert({
          where: { id: match.id },
          update: {
            player1Id: match.player1Id,
            player1Name: match.player1Name,
            player2Id: match.player2Id,
            player2Name: match.player2Name,
            stage: match.stage,
            round: match.round,
            status: match.status,
            result: match.result as any,
          },
          create: {
            id: match.id,
            tournamentId: tournament.id,
            player1Id: match.player1Id,
            player1Name: match.player1Name,
            player2Id: match.player2Id,
            player2Name: match.player2Name,
            stage: match.stage,
            round: match.round,
            status: match.status,
            result: match.result as any,
          }
        })
      }
    },
    
    // Matches
    getMatch: async (id: string): Promise<Match | undefined> => {
      const match = await prisma.match.findUnique({ where: { id } })
      return match ? {
        ...match,
        result: match.result as any,
        createdAt: new Date(match.createdAt),
        updatedAt: new Date(match.updatedAt),
      } as Match : undefined
    },
    
    updateMatch: async (match: Match): Promise<void> => {
      await prisma.match.update({
        where: { id: match.id },
        data: {
          player1Id: match.player1Id,
          player1Name: match.player1Name,
          player2Id: match.player2Id,
          player2Name: match.player2Name,
          stage: match.stage,
          round: match.round,
          status: match.status,
          result: match.result as any,
        }
      })
    },
    
    // Init (для первого запуска)
    initializeTestData: async (): Promise<void> => {
      // Проверяем, есть ли уже данные
      const existingUsers = await prisma.user.count()
      if (existingUsers > 0) {
        console.log('✅ Данные уже существуют в БД')
        return
      }
      
      console.log('🌱 Инициализация тестовых данных в БД...')
      
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
        await prisma.user.create({ data: user })
      }
      
      console.log('✅ Тестовые данные созданы')
    },
  }
}


/**
 * Адаптер для работы с БД
 * Автоматически переключается между Prisma (если есть DATABASE_URL) и in-memory storage
 */

import { User, Tournament, Match } from '@/types'
import { prisma } from './prisma'

// Проверяем наличие DATABASE_URL
const hasDatabaseUrl = process.env.DATABASE_URL && process.env.DATABASE_URL !== ''

console.log(hasDatabaseUrl ? '✅ Используется PostgreSQL через Prisma' : '💾 Используется in-memory storage')

// ======================
// User Methods
// ======================

export async function getUser(id: string): Promise<User | undefined> {
  if (!hasDatabaseUrl) {
    const { storage } = await import('./storage')
    return storage.getUser(id)
  }
  
  const user = await prisma.user.findUnique({ where: { id } })
  return user ? user as User : undefined
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  if (!hasDatabaseUrl) {
    const { storage } = await import('./storage')
    return storage.getUserByEmail(email)
  }
  
  const user = await prisma.user.findUnique({ where: { email } })
  return user ? user as User : undefined
}

export async function getAllUsers(): Promise<User[]> {
  if (!hasDatabaseUrl) {
    const { storage } = await import('./storage')
    return storage.getAllUsers()
  }
  
  return await prisma.user.findMany() as User[]
}

export async function createUser(user: User): Promise<User> {
  if (!hasDatabaseUrl) {
    const { storage } = await import('./storage')
    return storage.createUser(user)
  }
  
  return await prisma.user.create({ data: user }) as User
}

export async function updateUser(user: User): Promise<User> {
  if (!hasDatabaseUrl) {
    const { storage } = await import('./storage')
    storage.updateUser(user)
    return user
  }
  
  return await prisma.user.update({
    where: { id: user.id },
    data: user
  }) as User
}

// ======================
// Tournament Methods
// ======================

export async function getTournament(id: string): Promise<Tournament | undefined> {
  if (!hasDatabaseUrl) {
    const { storage } = await import('./storage')
    return storage.getTournament(id)
  }
  
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
}

export async function getCurrentTournament(): Promise<Tournament | undefined> {
  if (!hasDatabaseUrl) {
    const { storage } = await import('./storage')
    return storage.getCurrentTournament()
  }
  
  const tournament = await prisma.tournament.findFirst({
    include: { matches: true }
  })
  
  if (!tournament) return undefined
  
  return {
    ...tournament,
    matches: tournament.matches.map((m: any) => ({
      ...m,
      result: m.result as any,
      createdAt: new Date(m.createdAt),
      updatedAt: new Date(m.updatedAt),
    }))
  } as Tournament
}

export async function createTournament(tournament: Tournament): Promise<Tournament> {
  if (!hasDatabaseUrl) {
    const { storage } = await import('./storage')
    return storage.createTournament(tournament)
  }
  
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
          round: m.round || 1,
          status: m.status,
          result: m.result as any,
          proposedBy: m.proposedBy,
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
      proposedBy: m.proposedBy,
      createdAt: new Date(m.createdAt),
      updatedAt: new Date(m.updatedAt),
    }))
  } as Tournament
}

export async function updateTournament(tournament: Tournament): Promise<void> {
  if (!hasDatabaseUrl) {
    const { storage } = await import('./storage')
    storage.updateTournament(tournament)
    return
  }
  
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
        updatedAt: new Date(),
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
}

// ======================
// Match Methods
// ======================

export async function getMatch(tournamentId: string, matchId: string): Promise<Match | undefined> {
  if (!hasDatabaseUrl) {
    const { storage } = await import('./storage')
    return storage.getMatch(tournamentId, matchId)
  }
  
  const match = await prisma.match.findUnique({ where: { id: matchId } })
  return match ? {
    ...match,
    result: match.result as any,
    createdAt: new Date(match.createdAt),
    updatedAt: new Date(match.updatedAt),
  } as Match : undefined
}

export async function updateMatch(tournamentId: string, match: Match): Promise<void> {
  if (!hasDatabaseUrl) {
    const { storage } = await import('./storage')
    storage.updateMatch(tournamentId, match)
    return
  }
  
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
      updatedAt: new Date(),
    }
  })
}

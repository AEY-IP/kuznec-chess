import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/lib/db-adapter'
import { getServerSession } from '@/lib/auth'

// Отключаем кеширование Next.js
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  let tournament = await db.getCurrentTournament()
  
  // Если турнира нет, создаем его автоматически
  if (!tournament) {
    console.log('🎯 Турнир не найден, создаем новый...')
    
    // Получаем всех пользователей
    const users = await db.getAllUsers()
    const participantIds = users.map(u => u.id)
    
    if (participantIds.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 })
    }
    
    // Генерируем матчи группового этапа
    const participantNames: Record<string, string> = {}
    users.forEach(u => {
      participantNames[u.id] = u.nickname || u.username
    })
    
    const { generateGroupStageMatches } = await import('@/lib/tournament')
    const matches = generateGroupStageMatches(participantIds, participantNames)
    
    // Создаем турнир
    tournament = {
      id: 'tournament-1',
      name: 'Шахматный турнир 2026',
      participantIds,
      stage: 'group',
      matches,
      groupStageCompleted: false,
      winnersRoundStarted: false,
      finalStageStarted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    await db.createTournament(tournament)
    console.log('✅ Турнир создан автоматически')
  }
  
  return NextResponse.json({ tournament }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'CDN-Cache-Control': 'no-store',
    }
  })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, participantIds } = await request.json()
    const tournament = await db.getCurrentTournament()
    
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Генерация матчей группового этапа
    const participantNames: Record<string, string> = {}
    for (const id of participantIds) {
      const user = await db.getUser(id)
      if (user) participantNames[id] = user.nickname || user.username
    }

    const { generateGroupStageMatches } = await import('@/lib/tournament')
    const matches = generateGroupStageMatches(participantIds, participantNames)

    tournament.matches = matches
    tournament.participantIds = participantIds
    await db.updateTournament(tournament)

    return NextResponse.json({ tournament }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'CDN-Cache-Control': 'no-store',
      }
    })
  } catch (error) {
    console.error('Tournament create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


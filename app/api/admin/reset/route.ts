import { NextResponse } from 'next/server'
import * as db from '@/lib/db-adapter'
import { generateGroupStageMatches } from '@/lib/tournament'

export async function POST(request: Request) {
  try {
    const { secret } = await request.json()
    
    // Простая защита - нужно передать секретный ключ
    if (secret !== 'reset-kuznec-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Получаем всех пользователей
    const users = await db.getAllUsers()
    
    // Сбрасываем никнеймы у всех пользователей
    for (const user of users) {
      await db.updateUser({
        ...user,
        nickname: undefined, // Убираем никнейм
      })
    }

    // Получаем текущий турнир
    const tournament = await db.getCurrentTournament()
    
    if (tournament) {
      // Получаем имена участников (username, так как никнеймы сброшены)
      const participantNames: Record<string, string> = {}
      for (const id of tournament.participantIds) {
        const user = await db.getUser(id)
        if (user) {
          participantNames[id] = user.username
        }
      }
      
      // Генерируем новые чистые матчи
      const freshMatches = generateGroupStageMatches(tournament.participantIds, participantNames)
      
      // Обновляем турнир с чистыми матчами
      await db.updateTournament({
        ...tournament,
        matches: freshMatches,
        stage: 'group',
        groupStageCompleted: false,
        updatedAt: new Date(),
      })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Все никнеймы сброшены и результаты обнулены',
      usersReset: users.length,
      matchesReset: tournament?.matches.length || 0,
    })
  } catch (error) {
    console.error('Reset error:', error)
    return NextResponse.json({ 
      error: 'Failed to reset data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


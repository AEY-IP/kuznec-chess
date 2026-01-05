import { NextResponse } from 'next/server'
import * as db from '@/lib/db-adapter'

export async function POST(request: Request) {
  try {
    const { secret } = await request.json()
    
    if (secret !== 'reset-kuznec-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Получаем турнир
    const tournament = await db.getCurrentTournament()
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Получаем актуальные имена всех пользователей
    const users = await db.getAllUsers()
    const userNames: Record<string, string> = {}
    users.forEach(u => {
      userNames[u.id] = u.nickname || u.username
    })

    console.log('=== SYNC NAMES: User names ===')
    console.log(userNames)

    // Обновляем имена в каждом матче
    let updatedCount = 0
    for (const match of tournament.matches) {
      const player1NewName = userNames[match.player1Id]
      const player2NewName = userNames[match.player2Id]
      
      if (player1NewName !== match.player1Name || player2NewName !== match.player2Name) {
        console.log(`Updating match ${match.id}: ${match.player1Name} → ${player1NewName}, ${match.player2Name} → ${player2NewName}`)
        
        const updatedMatch = {
          ...match,
          player1Name: player1NewName,
          player2Name: player2NewName,
        }
        
        await db.updateMatch(tournament.id, updatedMatch)
        updatedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Имена игроков синхронизированы',
      updatedMatches: updatedCount,
      totalMatches: tournament.matches.length,
    })
  } catch (error) {
    console.error('Sync names error:', error)
    return NextResponse.json({
      error: 'Failed to sync names',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}


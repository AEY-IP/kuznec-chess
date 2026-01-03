import { NextResponse } from 'next/server'
import * as db from '@/lib/db-adapter'

export async function GET() {
  const tournament = await db.getCurrentTournament()
  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
  }

  // Получаем имена всех пользователей
  const userNames: Record<string, string> = {}
  for (const id of tournament.participantIds) {
    const user = await db.getUser(id)
    if (user) {
      userNames[id] = user.nickname || user.username
    }
  }

  // Фильтруем только групповые матчи
  const groupMatches = tournament.matches
    .filter(m => m.stage === 'group')
    .map(m => ({
      id: m.id,
      player1: userNames[m.player1Id] || m.player1Id,
      player2: userNames[m.player2Id] || m.player2Id,
      round: m.round,
      status: m.status,
      result: m.result ? {
        score: `${m.result.player1Score}:${m.result.player2Score}`,
        proposedBy: userNames[m.result.proposedBy] || m.result.proposedBy,
        confirmedBy: m.result.confirmedBy ? (userNames[m.result.confirmedBy] || m.result.confirmedBy) : null,
      } : null,
    }))

  // Подсчитываем игры каждого игрока
  const playerGames: Record<string, number> = {}
  tournament.participantIds.forEach(id => {
    playerGames[userNames[id]] = 0
  })

  groupMatches
    .filter(m => m.status === 'confirmed')
    .forEach(m => {
      playerGames[m.player1]++
      playerGames[m.player2]++
    })

  return NextResponse.json({
    totalMatches: groupMatches.length,
    confirmedMatches: groupMatches.filter(m => m.status === 'confirmed').length,
    pendingMatches: groupMatches.filter(m => m.status === 'result_pending_confirmation').length,
    matches: groupMatches,
    playerGames,
  }, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}


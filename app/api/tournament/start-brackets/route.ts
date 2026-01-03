import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/lib/db-adapter'
import { getServerSession } from '@/lib/auth'
import { getTop2Participants, getPlaces3And4, generateWinnersBracket, generateLosersBracket } from '@/lib/tournament'
import { calculateGroupStageStats } from '@/lib/tournament'

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const tournament = await db.getCurrentTournament()
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    if (tournament.groupStageCompleted) {
      return NextResponse.json({ error: 'Brackets already started' }, { status: 400 })
    }

    // Подсчет статистики и получение топ-4
    const participantNames: Record<string, string> = {}
    for (const id of tournament.participantIds) {
      const user = await db.getUser(id)
      if (user) participantNames[id] = user.nickname || user.username
    }

    const stats = calculateGroupStageStats(
      tournament.matches,
      tournament.participantIds,
      participantNames
    )

    // Топ-2 для верхней сетки
    const top2 = getTop2Participants(stats)
    const top2Names: Record<string, string> = {}
    top2.forEach(id => {
      top2Names[id] = participantNames[id]
    })

    // 3-4 места для нижней сетки
    const places3And4 = getPlaces3And4(stats)
    const places3And4Names: Record<string, string> = {}
    places3And4.forEach(id => {
      places3And4Names[id] = participantNames[id]
    })

    // Генерация сеток
    const winnersMatches = generateWinnersBracket(top2, top2Names)
    const losersMatches = generateLosersBracket(places3And4, places3And4Names)

    // Обновление турнира
    tournament.stage = 'winners'
    tournament.groupStageCompleted = true
    tournament.participantIds = [...top2, ...places3And4] // топ-4 для финального тура
    tournament.matches = [...tournament.matches, ...winnersMatches, ...losersMatches]

    await db.updateTournament(tournament)

    return NextResponse.json({ tournament })
  } catch (error) {
    console.error('Start brackets error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

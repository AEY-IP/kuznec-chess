import { NextResponse } from 'next/server'
import * as db from '@/lib/db-adapter'
import { calculateGroupStageStats } from '@/lib/tournament'

export async function GET() {
  const tournament = await db.getCurrentTournament()
  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
  }

  const participantNames: Record<string, string> = {}
  for (const id of tournament.participantIds) {
    const user = await db.getUser(id)
    if (user) participantNames[id] = user.nickname || user.username
  }

  // Логирование всех матчей группового этапа
  const groupMatches = tournament.matches.filter(m => m.stage === 'group')
  console.log('=== STATS API: All group matches ===')
  groupMatches.forEach(m => {
    console.log(`Match ${m.id}: ${participantNames[m.player1Id]} vs ${participantNames[m.player2Id]}`)
    console.log(`  Status: ${m.status}, Round: ${m.round}`)
    console.log(`  Result: ${m.result ? `${m.result.player1Score}:${m.result.player2Score}` : 'none'}`)
    console.log(`  ProposedBy: ${m.result?.proposedBy}, ConfirmedBy: ${m.result?.confirmedBy}`)
  })
  console.log('=== Total group matches:', groupMatches.length, '===')
  console.log('=== Confirmed group matches:', groupMatches.filter(m => m.status === 'confirmed').length, '===')

  const stats = calculateGroupStageStats(
    tournament.matches,
    tournament.participantIds,
    participantNames
  )

  console.log('=== CALCULATED STATS ===')
  stats.forEach(s => {
    console.log(`${s.username}: ${s.gamesPlayed} games, ${s.points} points`)
  })

  return NextResponse.json({ stats })
}


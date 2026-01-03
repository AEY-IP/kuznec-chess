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

  const stats = calculateGroupStageStats(
    tournament.matches,
    tournament.participantIds,
    participantNames
  )

  return NextResponse.json({ stats })
}


import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage'
import { calculateGroupStageStats } from '@/lib/tournament'

export async function GET() {
  // Автоматическая инициализация данных при первом запросе
  if (storage.getAllUsers().length === 0) {
    const { initializeTestData } = await import('@/lib/storage')
    initializeTestData()
  }

  const tournament = storage.getCurrentTournament()
  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
  }

  const participantNames: Record<string, string> = {}
  tournament.participants.forEach(id => {
    const user = storage.getUser(id)
    if (user) participantNames[id] = user.nickname || user.username
  })

  const stats = calculateGroupStageStats(
    tournament.matches,
    tournament.participants,
    participantNames
  )

  return NextResponse.json({ stats })
}


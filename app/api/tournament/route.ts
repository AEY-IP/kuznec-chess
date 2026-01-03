import { NextRequest, NextResponse } from 'next/server'
import { storage, initializeTestData } from '@/lib/storage'
import { getServerSession } from '@/lib/auth'

export async function GET() {
  // Автоматическая инициализация данных при первом запросе
  if (storage.getAllUsers().length === 0) {
    initializeTestData()
  }

  const tournament = storage.getCurrentTournament()
  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
  }
  return NextResponse.json({ tournament })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, participantIds } = await request.json()
    const tournament = storage.getCurrentTournament()
    
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Генерация матчей группового этапа
    const participantNames: Record<string, string> = {}
    participantIds.forEach((id: string) => {
      const user = storage.getUser(id)
      if (user) participantNames[id] = user.username
    })

    const { generateGroupStageMatches } = await import('@/lib/tournament')
    const matches = generateGroupStageMatches(participantIds, participantNames)

    tournament.matches = matches
    tournament.participants = participantIds
    storage.updateTournament(tournament)

    return NextResponse.json({ tournament })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/lib/db-adapter'
import { getServerSession } from '@/lib/auth'
import { Match } from '@/types'
import { processMatchCompletion } from '@/lib/bracket-progression'

// Отключаем кеширование Next.js
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const tournament = await db.getCurrentTournament()
  if (!tournament) {
    // Если турнира нет, возвращаем пустой массив вместо ошибки
    return NextResponse.json({ matches: [] })
  }

  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')
  const stage = searchParams.get('stage')
  const status = searchParams.get('status')

  let matches = tournament.matches

  if (userId) {
    matches = matches.filter(
      m => m.player1Id === userId || m.player2Id === userId
    )
  }

  if (stage) {
    matches = matches.filter(m => m.stage === stage)
  }

  if (status) {
    if (status === 'pending_confirmation') {
      matches = matches.filter(m => m.status === 'result_pending_confirmation')
    } else {
      matches = matches.filter(m => m.status === status)
    }
  }

  return NextResponse.json({ matches })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { matchId, result, action } = await request.json()
    
    if (!matchId) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 })
    }

    const tournament = await db.getCurrentTournament()
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    const matchIndex = tournament.matches.findIndex(m => m.id === matchId)
    if (matchIndex === -1) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const match = tournament.matches[matchIndex]
    const isParticipant = match.player1Id === session.id || match.player2Id === session.id

    if (!isParticipant) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    if (action === 'propose') {
      if (!result) {
        return NextResponse.json({ error: 'Result is required' }, { status: 400 })
      }

      // Получаем актуальные никнеймы игроков
      const player1 = await db.getUser(match.player1Id)
      const player2 = await db.getUser(match.player2Id)

      const updatedMatch: Match = {
        ...match,
        player1Name: player1?.nickname || player1?.username || match.player1Name,
        player2Name: player2?.nickname || player2?.username || match.player2Name,
        result: {
          player1Score: result.player1Score,
          player2Score: result.player2Score,
          proposedBy: session.id,
          player1Color: result.player1Color,
          player2Color: result.player2Color,
          gameNumber: result.gameNumber,
        },
        status: 'result_pending_confirmation',
        proposedBy: session.id,
        updatedAt: new Date(),
      }

      console.log('API: About to update match:', {
        matchId,
        oldStatus: match.status,
        newStatus: updatedMatch.status,
        proposedBy: updatedMatch.result?.proposedBy,
        tournamentId: tournament.id
      })

      await db.updateMatch(tournament.id, updatedMatch)
      
      const updatedTournament = await db.getTournament(tournament.id)
      const updatedMatchFromStorage = updatedTournament?.matches.find(m => m.id === matchId)
      
      console.log('API PUT /matches: After db.updateMatch:', {
        matchId,
        statusFromStorage: updatedMatchFromStorage?.status,
        proposedByFromStorage: updatedMatchFromStorage?.result?.proposedBy,
        tournamentId: tournament.id,
        totalMatchesInTournament: updatedTournament?.matches.length
      })
      
      return NextResponse.json({ 
        match: updatedMatchFromStorage || updatedMatch,
        success: true 
      })
    } 
    
    if (action === 'confirm') {
      if (!match.result) {
        return NextResponse.json({ error: 'No result to confirm' }, { status: 400 })
      }

      if (match.result.proposedBy === session.id) {
        return NextResponse.json({ error: 'Cannot confirm own result' }, { status: 400 })
      }

      // Обновляем имена игроков при подтверждении
      const player1 = await db.getUser(match.player1Id)
      const player2 = await db.getUser(match.player2Id)

      const updatedMatch: Match = {
        ...match,
        player1Name: player1?.nickname || player1?.username || match.player1Name,
        player2Name: player2?.nickname || player2?.username || match.player2Name,
        result: {
          ...match.result,
          confirmedBy: session.id,
        },
        status: 'confirmed',
        updatedAt: new Date(),
      }

      await db.updateMatch(tournament.id, updatedMatch)

      // Автоматическое продвижение игроков в турнирных сетках
      if (updatedMatch.stage !== 'group') {
        const updatedTournament = await db.getTournament(tournament.id)
        if (updatedTournament) {
          // Получаем имена участников для прогрессии
          const participantNames: Record<string, string> = {}
          for (const id of updatedTournament.participantIds) {
            const user = await db.getUser(id)
            if (user) participantNames[id] = user.nickname || user.username
          }
          processMatchCompletion(updatedTournament, updatedMatch, participantNames)
          // Сохраняем обновленный турнир после прогрессии
          await db.updateTournament(updatedTournament)
        }
      }

      const finalTournament = await db.getTournament(tournament.id)
      const finalMatch = finalTournament?.matches.find(m => m.id === matchId)
      
      return NextResponse.json({ 
        match: finalMatch || updatedMatch,
        success: true 
      })
    } 
    
    if (action === 'reject') {
      const updatedMatch: Match = {
        ...match,
        result: undefined,
        status: 'pending',
        proposedBy: undefined,
        updatedAt: new Date(),
      }

      await db.updateMatch(tournament.id, updatedMatch)
      
      const finalTournament = await db.getTournament(tournament.id)
      const finalMatch = finalTournament?.matches.find(m => m.id === matchId)
      
      return NextResponse.json({ 
        match: finalMatch || updatedMatch,
        success: true 
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in PUT /api/tournament/matches:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

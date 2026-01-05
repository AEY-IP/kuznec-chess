import { NextResponse } from 'next/server'
import * as db from '@/lib/db-adapter'
import { generateGroupStageMatches } from '@/lib/tournament'
import type { Match } from '@/types'

export async function POST(request: Request) {
  try {
    const { secret, email, username } = await request.json()
    
    if (secret !== 'reset-kuznec-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!email || !username) {
      return NextResponse.json({ error: 'Email and username required' }, { status: 400 })
    }

    console.log(`=== Adding new player: ${username} (${email}) ===`)

    // Проверяем существует ли такой пользователь
    const existingUser = await db.getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Создаем нового пользователя
    const newUser = await db.createUser({
      id: `user-${Date.now()}`,
      email,
      username,
      nickname: undefined,
      role: 'user',
      createdAt: new Date(),
    })

    console.log(`✅ Created user: ${newUser.id}`)

    // Получаем турнир
    const tournament = await db.getCurrentTournament()
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Добавляем нового игрока в список участников
    const updatedParticipantIds = [...tournament.participantIds, newUser.id]

    // Получаем актуальные имена всех участников
    const participantNames: Record<string, string> = {}
    for (const id of updatedParticipantIds) {
      const user = await db.getUser(id)
      if (user) {
        participantNames[id] = user.nickname || user.username
      }
    }

    console.log('Participant names:', participantNames)

    // Генерируем матчи между новым игроком и всеми остальными
    const newMatches: Match[] = []
    let matchIdCounter = tournament.matches.length + 1

    for (const existingPlayerId of tournament.participantIds) {
      // Два матча: новый игрок vs существующий игрок
      // Матч 1 (round 1)
      newMatches.push({
        id: `group-${matchIdCounter++}`,
        player1Id: existingPlayerId,
        player2Id: newUser.id,
        player1Name: participantNames[existingPlayerId],
        player2Name: participantNames[newUser.id],
        stage: 'group',
        round: 1,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Матч 2 (round 2)
      newMatches.push({
        id: `group-${matchIdCounter++}`,
        player1Id: existingPlayerId,
        player2Id: newUser.id,
        player1Name: participantNames[existingPlayerId],
        player2Name: participantNames[newUser.id],
        stage: 'group',
        round: 2,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    console.log(`✅ Generated ${newMatches.length} new matches`)

    // Обновляем турнир
    const updatedTournament = {
      ...tournament,
      participantIds: updatedParticipantIds,
      matches: [...tournament.matches, ...newMatches],
      updatedAt: new Date(),
    }

    await db.updateTournament(updatedTournament)

    console.log('✅ Tournament updated')

    // Подсчитываем новую статистику
    const totalPlayers = updatedParticipantIds.length
    const matchesPerPlayer = (totalPlayers - 1) * 2
    const maxPoints = (totalPlayers - 1) * 2 // 2 игры с каждым соперником
    const totalMatches = (totalPlayers * (totalPlayers - 1))

    return NextResponse.json({
      success: true,
      message: `Игрок ${username} успешно добавлен`,
      newPlayer: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
      },
      tournament: {
        totalPlayers,
        matchesPerPlayer,
        maxPoints,
        totalMatches,
        newMatchesAdded: newMatches.length,
      }
    })
  } catch (error) {
    console.error('Add player error:', error)
    return NextResponse.json({
      error: 'Failed to add player',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}


'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Tournament, Match } from '@/types'
import { UnifiedBracket } from '@/components/UnifiedBracket'
import { MatchResultModal } from '@/components/MatchResultModal'

export default function FinalStagePage() {
  const { user } = useAuth()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false) // Сразу false, так как показываем демо

  useEffect(() => {
    // Загружаем турнир в фоне (необязательно для демо)
    loadTournament().catch(() => {
      // Игнорируем ошибки загрузки, демо-данные все равно показываются
    })
  }, [])

  const loadTournament = async () => {
    try {
      const res = await fetch('/api/tournament')
      const data = await res.json()
      if (data.tournament) {
        setTournament(data.tournament)
      }
    } catch (error) {
      console.error('Failed to load tournament:', error)
      // Игнорируем ошибки, демо-данные все равно показываются
    }
    // Не меняем loading, так как демо-данные уже показываются
  }

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match)
    setIsModalOpen(true)
  }

  const handleResultSubmit = async (result: { player1Score: number; player2Score: number }) => {
    if (!selectedMatch) return

    try {
      const res = await fetch('/api/tournament/matches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          result,
          action: selectedMatch.status === 'pending' ? 'propose' : 'propose',
        }),
      })

      if (res.ok) {
        await loadTournament()
        setIsModalOpen(false)
        setSelectedMatch(null)
      }
    } catch (error) {
      console.error('Failed to submit result:', error)
      alert('Ошибка при отправке результата')
    }
  }

  const handleConfirm = async () => {
    if (!selectedMatch) return

    try {
      const res = await fetch('/api/tournament/matches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          action: 'confirm',
        }),
      })

      if (res.ok) {
        await loadTournament()
        setIsModalOpen(false)
        setSelectedMatch(null)
      }
    } catch (error) {
      console.error('Failed to confirm result:', error)
      alert('Ошибка при подтверждении результата')
    }
  }

  const handleReject = async () => {
    if (!selectedMatch) return

    try {
      const res = await fetch('/api/tournament/matches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          action: 'reject',
        }),
      })

      if (res.ok) {
        await loadTournament()
        setIsModalOpen(false)
        setSelectedMatch(null)
      }
    } catch (error) {
      console.error('Failed to reject result:', error)
      alert('Ошибка при отклонении результата')
    }
  }

  // Временные данные для визуализации (всегда показываем демо)
  const getDemoTournament = (): Tournament => {
    // Всегда показываем демо-данные для визуализации структуры
    // if (tournament && tournament.groupStageCompleted && tournament.matches.some(m => m.stage === 'winners' || m.stage === 'losers' || m.stage === 'final')) {
    //   return tournament
    // }

    // Создаем демо-данные
    const demoMatches: Match[] = []
    const participantIds = ['user-1', 'user-2', 'user-3', 'user-4']
    const participantNames: Record<string, string> = {
      'user-1': 'Игрок 1',
      'user-2': 'Игрок 2',
      'user-3': 'Игрок 3',
      'user-4': 'Игрок 4',
    }

    // Верхняя сетка (топ-2)
    demoMatches.push({
      id: 'winners-1',
      player1Id: 'user-1',
      player2Id: 'user-2',
      player1Name: 'Игрок 1',
      player2Name: 'Игрок 2',
      stage: 'winners',
      round: 1,
      status: 'confirmed',
      result: {
        player1Score: 1,
        player2Score: 0,
        proposedBy: 'user-1',
        confirmedBy: 'user-2',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Нижняя сетка (3-4 места) - первый тур
    demoMatches.push({
      id: 'losers-1',
      player1Id: 'user-3',
      player2Id: 'user-4',
      player1Name: 'Игрок 3',
      player2Name: 'Игрок 4',
      stage: 'losers',
      round: 1,
      status: 'confirmed',
      result: {
        player1Score: 0.5,
        player2Score: 0.5,
        proposedBy: 'user-3',
        confirmedBy: 'user-4',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Нижняя сетка - второй тур (победитель первого тура vs проигравший из верхней)
    demoMatches.push({
      id: 'losers-2',
      player1Id: 'user-3',
      player2Id: 'user-2',
      player1Name: 'Игрок 3',
      player2Name: 'Игрок 2',
      stage: 'losers',
      round: 2,
      status: 'confirmed',
      result: {
        player1Score: 1,
        player2Score: 0,
        proposedBy: 'user-3',
        confirmedBy: 'user-2',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Финал - первая игра
    demoMatches.push({
      id: 'final-1',
      player1Id: 'user-1',
      player2Id: 'user-3',
      player1Name: 'Игрок 1',
      player2Name: 'Игрок 3',
      stage: 'final',
      round: 1,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Матч за 3-е место (игрок 2 vs игрок 4)
    demoMatches.push({
      id: 'third-place-1',
      player1Id: 'user-2',
      player2Id: 'user-4',
      player1Name: 'Игрок 2',
      player2Name: 'Игрок 4',
      stage: 'third_place',
      round: 1,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return {
      id: 'demo-tournament',
      name: 'Демо турнир',
      stage: 'final',
      participants: participantIds,
      matches: demoMatches,
      groupStageCompleted: true,
      startedAt: new Date(),
    }
  }

  // Всегда показываем демо-данные
  const displayTournament = getDemoTournament()

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <UnifiedBracket
        matches={displayTournament.matches}
        currentUserId={user?.id}
        readOnly={true}
        onResultClick={handleMatchClick}
      />

      {selectedMatch && user && (
        <MatchResultModal
          match={selectedMatch}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedMatch(null)
          }}
          onSubmit={handleResultSubmit}
          onConfirm={handleConfirm}
          onReject={handleReject}
          currentUserId={user.id}
        />
      )}
    </div>
  )
}


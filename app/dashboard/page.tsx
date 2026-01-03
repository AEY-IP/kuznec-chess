'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Leaderboard } from '@/components/Leaderboard'
import { TournamentBracket } from '@/components/TournamentBracket'
import { BracketTree } from '@/components/BracketTree'
import { MatchResultModal } from '@/components/MatchResultModal'
import { Match, Tournament, GroupStageStats } from '@/types'
import { Trophy, Users, Calendar } from 'lucide-react'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [stats, setStats] = useState<GroupStageStats[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      loadTournament()
    }
  }, [authLoading])

  const loadTournament = async () => {
    try {
      const res = await fetch('/api/tournament')
      const data = await res.json()
      if (data.tournament) {
        setTournament(data.tournament)
        if (data.tournament.stage === 'group' || data.tournament.groupStageCompleted) {
          loadStats()
        }
      }
    } catch (error) {
      console.error('Failed to load tournament:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const res = await fetch('/api/tournament/stats')
      const data = await res.json()
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match)
    setIsModalOpen(true)
  }

  const handleResultSubmit = async (result: { player1Score: number; player2Score: number }, action?: string) => {
    if (!selectedMatch) return

    try {
      const res = await fetch('/api/tournament/matches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          result,
          action: action || (selectedMatch.status === 'pending' ? 'propose' : 'propose'),
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Загрузка...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const userMatches = tournament?.matches.filter(
    m => m.player1Id === user.id || m.player2Id === user.id
  ) || []

  const completedMatches = userMatches.filter(m => m.status === 'confirmed').length
  const pendingMatches = userMatches.filter(m => m.status === 'result_pending_confirmation').length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
          {tournament?.name || 'Турнир'}
        </h1>
        <div className="flex items-center space-x-6 text-slate-600 dark:text-slate-400">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>{tournament?.participantIds.length || 0} участников</span>
          </div>
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>
              {tournament?.stage === 'group' ? 'Групповой этап' : 
               tournament?.stage === 'winners' ? 'Сетка винеров' :
               tournament?.stage === 'losers' ? 'Сетка лузеров' : 'Финал'}
            </span>
          </div>
        </div>
      </div>

      {/* Статистика пользователя */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <div className="text-slate-600 dark:text-slate-400 text-sm mb-1">Сыграно матчей</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{completedMatches}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <div className="text-slate-600 dark:text-slate-400 text-sm mb-1">Ожидают подтверждения</div>
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{pendingMatches}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <div className="text-slate-600 dark:text-slate-400 text-sm mb-1">Всего матчей</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{userMatches.length}</div>
        </div>
      </div>

      {/* Лидерборд для группового этапа */}
      {tournament?.stage === 'group' && stats.length > 0 && (
        <div className="mb-8">
          <Leaderboard stats={stats} />
        </div>
      )}

      {/* Турнирные сетки */}
      {tournament?.groupStageCompleted && (
        <div className="space-y-8">
          {tournament.stage === 'winners' || tournament.stage === 'losers' || tournament.stage === 'final' ? (
            <>
              <BracketTree
                matches={tournament.matches}
                stage="winners"
                currentUserId={user.id}
                onResultClick={handleMatchClick}
              />
              <BracketTree
                matches={tournament.matches}
                stage="losers"
                currentUserId={user.id}
                onResultClick={handleMatchClick}
              />
            </>
          ) : null}
        </div>
      )}

      {/* Модальное окно результата */}
      {selectedMatch && (
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
          currentUserId={user?.id}
        />
      )}
    </div>
  )
}


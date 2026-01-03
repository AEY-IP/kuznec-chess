'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { UserStats, Match, Tournament, User } from '@/types'
import { calculateUserStats } from '@/lib/user-stats'
import { RecordResultModal } from '@/components/RecordResultModal'
import { ParticipantsList } from '@/components/ParticipantsList'
import { CheckCircle, Trophy, TrendingUp, BarChart3, Clock } from 'lucide-react'

export default function HomePage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [waitingCount, setWaitingCount] = useState(0)
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [participants, setParticipants] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadData = async () => {
    try {
      const [matchesRes, pendingRes, tournamentRes, usersRes] = await Promise.all([
        fetch(`/api/tournament/matches?userId=${user?.id}`),
        fetch(`/api/tournament/matches?userId=${user?.id}&status=pending_confirmation`),
        fetch('/api/tournament'),
        fetch('/api/users'),
      ])

      const matchesData = await matchesRes.json()
      const pendingData = await pendingRes.json()
      const tournamentData = await tournamentRes.json()
      const usersData = await usersRes.json()

      if (matchesData.matches) {
        const userStats = calculateUserStats(user!.id, matchesData.matches)
        setStats(userStats)
      }

      if (pendingData.matches) {
        // Матчи, требующие подтверждения от меня (предложены другими)
        const pending = pendingData.matches.filter((m: Match) => 
          m.status === 'result_pending_confirmation' && 
          m.result?.proposedBy !== user?.id
        )
        setPendingCount(pending.length)
        
        // Матчи, ожидающие подтверждения от других (предложены мной)
        const waiting = pendingData.matches.filter((m: Match) => 
          m.status === 'result_pending_confirmation' && 
          m.result?.proposedBy === user?.id
        )
        setWaitingCount(waiting.length)
      }

      if (tournamentData.tournament) {
        setTournament(tournamentData.tournament)
        
        // Загружаем участников
        if (usersData.users && tournamentData.tournament.participantIds) {
          const tournamentParticipants = tournamentData.tournament.participantIds
            .map((id: string) => usersData.users.find((u: User) => u.id === id))
            .filter((u: User | undefined): u is User => u !== undefined)
          setParticipants(tournamentParticipants)
        }
      }

      // Если нет матчей, все равно устанавливаем пустую статистику
      if (!matchesData.matches || matchesData.matches.length === 0) {
        const emptyStats = calculateUserStats(user!.id, [])
        setStats(emptyStats)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBestColorText = () => {
    if (!stats) return '-'
    if (stats.bestColor === 'equal') return 'Одинаковый результат за б/ч'
    if (stats.bestColor === 'white') return 'Белые'
    return 'Черные'
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Загрузка...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-slate-600 dark:text-slate-400">Загрузка статистики...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 md:mb-10 animate-fade-in">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary-light to-accent-mint bg-clip-text text-transparent mb-2 md:mb-3">
          Главная
        </h1>
        <p className="text-gray-600 text-base md:text-lg font-medium">Ваша статистика и управление партиями</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-up">
        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:scale-105 group">
          <div className="flex items-center justify-between mb-3">
            <div className="text-gray-600 text-sm font-semibold">Сыграно игр</div>
            <div className="text-3xl group-hover:scale-110 transition-transform">♙</div>
          </div>
          <div className="text-4xl font-bold text-primary">{stats.totalGames}</div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-accent-mint/20 hover:border-accent-mint/40 transition-all duration-300 hover:shadow-2xl hover:scale-105 group">
          <div className="flex items-center justify-between mb-3">
            <div className="text-gray-600 text-sm font-semibold">Побед</div>
            <div className="text-3xl group-hover:scale-110 transition-transform">♔</div>
          </div>
          <div className="text-4xl font-bold text-accent-mint">
            {stats.winPercentage}%
          </div>
          <div className="text-sm text-gray-500 mt-2 font-medium">
            {stats.wins} из {stats.totalGames}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-accent-cyan/20 hover:border-accent-cyan/40 transition-all duration-300 hover:shadow-2xl hover:scale-105 group">
          <div className="flex items-center justify-between mb-3">
            <div className="text-gray-600 text-sm font-semibold">Ничьих</div>
            <div className="text-3xl group-hover:scale-110 transition-transform">♕</div>
          </div>
          <div className="text-4xl font-bold text-accent-cyan">
            {stats.drawPercentage}%
          </div>
          <div className="text-sm text-gray-500 mt-2 font-medium">
            {stats.draws} из {stats.totalGames}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-primary-light/20 hover:border-primary-light/40 transition-all duration-300 hover:shadow-2xl hover:scale-105 group">
          <div className="flex items-center justify-between mb-3">
            <div className="text-gray-600 text-sm font-semibold">Поражений</div>
            <div className="text-3xl group-hover:scale-110 transition-transform">♖</div>
          </div>
          <div className="text-4xl font-bold text-primary-light">
            {stats.lossPercentage}%
          </div>
          <div className="text-sm text-gray-500 mt-2 font-medium">
            {stats.losses} из {stats.totalGames}
          </div>
        </div>
      </div>

      {/* Лучший цвет */}
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl p-8 mb-10 border-2 border-primary/10 animate-scale-in">
        <h2 className="text-3xl font-bold text-primary mb-6 flex items-center space-x-3">
          <span className="text-4xl">♗</span>
          <span>Статистика по цветам</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-primary/10 hover:border-primary/30 transition-all">
            <div className="text-sm text-gray-600 mb-2 font-semibold">Лучший цвет</div>
            <div className="text-2xl font-bold text-primary">
              {getBestColorText()}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-accent-mint/20 hover:border-accent-mint/40 transition-all">
            <div className="text-sm text-gray-600 mb-2 font-semibold">За белых</div>
            <div className="text-xl font-bold text-gray-800">
              {stats.whitePoints} очков ({stats.whiteGames} игр)
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-gray-200 hover:border-gray-300 transition-all">
            <div className="text-sm text-gray-600 mb-2 font-semibold">За черных</div>
            <div className="text-xl font-bold text-gray-800">
              {stats.blackPoints} очков ({stats.blackGames} игр)
            </div>
          </div>
        </div>
      </div>

      {/* Список участников */}
      <div className="mb-8">
        <ParticipantsList
          participants={participants}
          currentUserId={user.id}
          tournament={tournament}
        />
      </div>

      {/* Кнопки действий */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="bg-gradient-to-br from-primary to-primary-light text-white rounded-2xl shadow-2xl p-8 hover:shadow-[0_0_40px_rgba(36,27,222,0.4)] transition-all duration-300 text-left transform hover:scale-105 hover:-translate-y-1 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold mb-2">Записать результат</div>
              <div className="text-white/80 text-sm font-medium">Введите результат партии</div>
            </div>
            <div className="text-5xl group-hover:scale-110 group-hover:rotate-12 transition-all">♘</div>
          </div>
        </button>

        <Link
          href="/pending-matches"
          className="bg-gradient-to-br from-accent-mint to-accent-cyan text-white rounded-2xl shadow-2xl p-8 hover:shadow-[0_0_40px_rgba(94,219,190,0.5)] transition-all duration-300 text-left relative block transform hover:scale-105 hover:-translate-y-1 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold mb-2">Требуют подтверждения</div>
              <div className="text-white/80 text-sm font-medium">Партии от других игроков</div>
            </div>
            <div className="relative">
              <div className="text-5xl group-hover:scale-110 transition-transform">♜</div>
              {pendingCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-bold rounded-full h-8 w-8 flex items-center justify-center animate-pulse shadow-lg">
                  {pendingCount}
                </span>
              )}
            </div>
          </div>
        </Link>

        <Link
          href="/waiting-matches"
          className="bg-gradient-to-br from-primary-light to-accent-cyan text-white rounded-2xl shadow-2xl p-8 hover:shadow-[0_0_40px_rgba(95,167,220,0.5)] transition-all duration-300 text-left relative block transform hover:scale-105 hover:-translate-y-1 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold mb-2">Ожидают подтверждения</div>
              <div className="text-white/80 text-sm font-medium">Ваши предложенные партии</div>
            </div>
            <div className="relative">
              <div className="text-5xl group-hover:scale-110 transition-transform">♝</div>
              {waitingCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-sm font-bold rounded-full h-8 w-8 flex items-center justify-center animate-pulse shadow-lg">
                  {waitingCount}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Модальное окно записи результата */}
      {isRecordModalOpen && (
        <RecordResultModal
          isOpen={isRecordModalOpen}
          onClose={() => {
            setIsRecordModalOpen(false)
          }}
          onSuccess={() => {
            loadData()
            // Отправляем событие для обновления других страниц
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('match-updated'))
            }
          }}
          currentUserId={user.id}
        />
      )}
    </div>
  )
}


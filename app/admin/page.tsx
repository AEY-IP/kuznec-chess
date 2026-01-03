'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { Tournament, User } from '@/types'
import { generateGroupStageMatches } from '@/lib/tournament'
import { Play, Users, Trophy } from 'lucide-react'

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      const [tournamentRes, usersRes] = await Promise.all([
        fetch('/api/tournament'),
        fetch('/api/users'),
      ])

      const tournamentData = await tournamentRes.json()
      const usersData = await usersRes.json()

      if (tournamentData.tournament) {
        setTournament(tournamentData.tournament)
        setSelectedParticipants(tournamentData.tournament.participants || [])
      }

      if (usersData.users) {
        setAllUsers(usersData.users.filter((u: User) => u.role === 'user'))
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleParticipantToggle = (userId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleStartGroupStage = async () => {
    if (selectedParticipants.length < 2) {
      alert('Выберите минимум 2 участника')
      return
    }

    try {
      const participantNames: Record<string, string> = {}
      selectedParticipants.forEach(id => {
        const user = allUsers.find(u => u.id === id)
        if (user) participantNames[id] = user.username
      })

      const res = await fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantIds: selectedParticipants,
        }),
      })

      if (res.ok) {
        await loadData()
        alert('Групповой этап начат!')
      }
    } catch (error) {
      console.error('Failed to start group stage:', error)
      alert('Ошибка при запуске группового этапа')
    }
  }

  const handleStartBrackets = async () => {
    if (!tournament) return

    const confirmedMatches = tournament.matches.filter(m => m.status === 'confirmed')
    const groupMatches = tournament.matches.filter(m => m.stage === 'group')
    
    if (confirmedMatches.length < groupMatches.length) {
      alert('Не все матчи группового этапа завершены')
      return
    }

    try {
      const res = await fetch('/api/tournament/start-brackets', {
        method: 'POST',
      })

      if (res.ok) {
        await loadData()
        alert('Турнирные сетки созданы!')
      }
    } catch (error) {
      console.error('Failed to start brackets:', error)
      alert('Ошибка при создании сеток')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Загрузка...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const groupMatchesCount = tournament?.matches.filter(m => m.stage === 'group').length || 0
  const confirmedGroupMatches = tournament?.matches.filter(
    m => m.stage === 'group' && m.status === 'confirmed'
  ).length || 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Админ-панель</h1>
        <p className="text-slate-600 dark:text-slate-400">Управление турниром</p>
      </div>

      {/* Статус турнира */}
      {tournament && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Статус турнира</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Trophy className="h-6 w-6 text-primary-600" />
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Этап</div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  {tournament.stage === 'group' ? 'Групповой этап' :
                   tournament.stage === 'winners' ? 'Сетка винеров' :
                   tournament.stage === 'losers' ? 'Сетка лузеров' : 'Финал'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-primary-600" />
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Участников</div>
                <div className="font-semibold text-slate-900 dark:text-white">{tournament.participants.length}</div>
              </div>
            </div>
            {tournament.stage === 'group' && (
              <div className="flex items-center space-x-3">
                <Play className="h-6 w-6 text-primary-600" />
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Матчи группового этапа</div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {confirmedGroupMatches} / {groupMatchesCount}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Управление участниками */}
      {tournament?.stage === 'group' && tournament.matches.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Выбор участников</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
            {allUsers.map(user => (
              <label
                key={user.id}
                className="flex items-center space-x-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedParticipants.includes(user.id)}
                  onChange={() => handleParticipantToggle(user.id)}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-white">{user.username}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{user.email}</div>
                </div>
                {user.rating && (
                  <div className="text-sm text-slate-600 dark:text-slate-400">Рейтинг: {user.rating}</div>
                )}
              </label>
            ))}
          </div>
          <button
            onClick={handleStartGroupStage}
            disabled={selectedParticipants.length < 2}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Начать групповой этап ({selectedParticipants.length} участников)
          </button>
        </div>
      )}

      {/* Запуск турнирных сеток */}
      {tournament?.stage === 'group' && tournament.matches.length > 0 && !tournament.groupStageCompleted && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Запуск турнирных сеток</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            После завершения всех матчей группового этапа можно запустить турнирные сетки.
            Топ-8 игроков пройдут во второй этап.
          </p>
          <div className="mb-4">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Прогресс: {confirmedGroupMatches} / {groupMatchesCount} матчей завершено
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${(confirmedGroupMatches / groupMatchesCount) * 100}%` }}
              />
            </div>
          </div>
          <button
            onClick={handleStartBrackets}
            disabled={confirmedGroupMatches < groupMatchesCount}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Запустить турнирные сетки
          </button>
        </div>
      )}

      {tournament?.groupStageCompleted && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">
            Турнирные сетки запущены
          </h3>
          <p className="text-green-700 dark:text-green-400">
            Второй этап турнира начат. Участники могут видеть сетки винеров и лузеров на главной странице.
          </p>
        </div>
      )}
    </div>
  )
}


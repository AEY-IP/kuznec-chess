'use client'

import { useEffect, useState } from 'react'
import { GroupStageStats } from '@/types'
import { Trophy, Medal, Award } from 'lucide-react'

export default function GroupStagePage() {
  const [stats, setStats] = useState<GroupStageStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await fetch('/api/tournament/stats')
      const data = await res.json()
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Убрали иконки наград

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 md:mb-10 animate-fade-in">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary-light to-accent-mint bg-clip-text text-transparent mb-2 md:mb-3 flex items-center space-x-2 md:space-x-4">
          <span className="text-4xl md:text-6xl">♖</span>
          <span>Групповой тур</span>
        </h1>
        <p className="text-gray-600 text-base md:text-lg font-medium">
          Рейтинговая таблица всех участников
        </p>
      </div>

      <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-8 overflow-x-auto border-2 border-primary/10 animate-slide-up">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b-2 border-primary/20">
              <th className="text-left py-3 md:py-4 px-2 md:px-4 text-primary font-bold text-xs md:text-sm uppercase tracking-wider">Место</th>
              <th className="text-left py-3 md:py-4 px-2 md:px-4 text-primary font-bold text-xs md:text-sm uppercase tracking-wider">Никнейм</th>
              <th className="text-center py-3 md:py-4 px-2 md:px-4 text-primary font-bold text-xs md:text-sm uppercase tracking-wider">Сыграно</th>
              <th className="text-center py-3 md:py-4 px-2 md:px-4 text-primary font-bold text-xs md:text-sm uppercase tracking-wider">Осталось</th>
              <th className="text-center py-3 md:py-4 px-2 md:px-4 text-primary font-bold text-xs md:text-sm uppercase tracking-wider">П</th>
              <th className="text-center py-3 md:py-4 px-2 md:px-4 text-primary font-bold text-xs md:text-sm uppercase tracking-wider">Н</th>
              <th className="text-center py-3 md:py-4 px-2 md:px-4 text-primary font-bold text-xs md:text-sm uppercase tracking-wider">Пор</th>
              <th className="text-center py-3 md:py-4 px-2 md:px-4 text-primary font-bold text-xs md:text-sm uppercase tracking-wider">Очки</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((player, index) => {
              const isWinnersBracket = index < 2 // Первые два места - верхняя сетка
              const isLosersBracket = index >= 2 && index < 4 // 3-4 места - нижняя сетка
              
              return (
                <tr
                  key={player.userId}
                  className={`border-b border-gray-100 hover:bg-white/80 transition-all duration-200 ${
                    isWinnersBracket ? 'bg-accent-mint/10' : 
                    isLosersBracket ? 'bg-accent-cyan/10' : ''
                  }`}
                >
                  <td className="py-5 px-4">
                    <span className="text-2xl font-bold text-primary">{index + 1}</span>
                  </td>
                  <td className="py-5 px-4">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-gray-900 text-lg">{player.username}</span>
                      {isWinnersBracket && (
                        <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-accent-mint to-accent-cyan text-white rounded-full font-bold shadow-lg">
                          Верхняя сетка
                        </span>
                      )}
                      {isLosersBracket && (
                        <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-primary-light to-accent-cyan text-white rounded-full font-bold shadow-lg">
                          Нижняя сетка
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-5 px-4 text-center text-gray-700 font-semibold">{player.gamesPlayed}</td>
                  <td className="py-5 px-4 text-center text-gray-700 font-semibold">{player.gamesRemaining}</td>
                  <td className="py-5 px-4 text-center text-accent-mint font-bold text-lg">{player.wins}</td>
                  <td className="py-5 px-4 text-center text-accent-cyan font-bold text-lg">{player.draws}</td>
                  <td className="py-5 px-4 text-center text-primary-light font-bold text-lg">{player.losses}</td>
                  <td className="py-5 px-4 text-center font-black text-primary text-xl">{player.points}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {stats.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Максимальное количество очков: 14. Топ-4 игрока проходят в финальный тур.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-600 rounded"></div>
                <span className="text-slate-700 dark:text-slate-300">1-2 места — Верхняя сетка (прямой выход в финал)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span className="text-slate-700 dark:text-slate-300">3-4 места — Нижняя сетка</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


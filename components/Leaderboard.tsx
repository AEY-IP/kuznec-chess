'use client'

import { GroupStageStats } from '@/types'
import { Trophy, Medal, Award } from 'lucide-react'

interface LeaderboardProps {
  stats: GroupStageStats[]
}

export function Leaderboard({ stats }: LeaderboardProps) {
  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />
    return null
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Лидерборд группового этапа</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">Место</th>
              <th className="text-left py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">Игрок</th>
              <th className="text-center py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">Победы</th>
              <th className="text-center py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">Ничьи</th>
              <th className="text-center py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">Поражения</th>
              <th className="text-center py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">Очки</th>
              <th className="text-center py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">Игр</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((player, index) => (
              <tr
                key={player.userId}
                className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                  index < 8 ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''
                }`}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{index + 1}</span>
                    {getRankIcon(index)}
                  </div>
                </td>
                <td className="py-4 px-4 font-medium text-slate-900 dark:text-white">{player.username}</td>
                <td className="py-4 px-4 text-center text-green-600 dark:text-green-400 font-semibold">{player.wins}</td>
                <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">{player.draws}</td>
                <td className="py-4 px-4 text-center text-red-600 dark:text-red-400">{player.losses}</td>
                <td className="py-4 px-4 text-center font-bold text-primary-600 dark:text-primary-400">{player.points}</td>
                <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">{player.gamesPlayed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {stats.length > 0 && (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Топ-8 игроков проходят во второй этап турнира
        </p>
      )}
    </div>
  )
}


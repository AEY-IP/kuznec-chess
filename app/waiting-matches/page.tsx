'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Match, PieceColor } from '@/types'
import { Clock, CheckCircle } from 'lucide-react'

export default function WaitingMatchesPage() {
  const { user } = useAuth()
  const [waitingMatches, setWaitingMatches] = useState<Match[]>([])
  const [opponentNames, setOpponentNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadWaitingMatches()
    }
  }, [user])

  // Перезагружаем данные при фокусе на странице
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        loadWaitingMatches()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])

  // Перезагружаем данные при видимости страницы
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        loadWaitingMatches()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user])

  const loadWaitingMatches = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      console.log('WaitingMatches: Loading matches for user:', user.id)
      const res = await fetch(`/api/tournament/matches?userId=${user.id}&_t=${Date.now()}`)
      const data = await res.json()
      console.log('WaitingMatches: Received matches:', data.matches?.length || 0)
      
      if (data.matches) {
        // Фильтруем матчи, где:
        // 1. Статус = result_pending_confirmation
        // 2. Текущий пользователь является участником
        // 3. Результат предложен текущим пользователем
        const waiting = data.matches.filter((m: Match) => {
          const isParticipant = m.player1Id === user.id || m.player2Id === user.id
          const isPending = m.status === 'result_pending_confirmation'
          const isProposedByMe = m.result?.proposedBy === user.id
          
          return isParticipant && isPending && isProposedByMe
        })
        console.log('WaitingMatches: Filtered waiting matches:', waiting.length)
        setWaitingMatches(waiting)
        
        // Загружаем имена оппонентов
        if (waiting.length > 0) {
          await loadOpponentNames()
        }
      } else {
        setWaitingMatches([])
      }
    } catch (error) {
      console.error('Failed to load waiting matches:', error)
      setWaitingMatches([])
    } finally {
      setLoading(false)
    }
  }

  const loadOpponentNames = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (data.users) {
        const names: Record<string, string> = {}
        data.users.forEach((u: any) => {
          names[u.id] = u.nickname || u.username
        })
        setOpponentNames(names)
      }
    } catch (error) {
      console.error('Failed to load opponent names:', error)
    }
  }

  const getPlayerColor = (match: Match): PieceColor => {
    if (!match.result) return 'white'
    const isPlayer1 = match.player1Id === user?.id
    return isPlayer1 ? (match.result.player1Color || 'white') : (match.result.player2Color || 'black')
  }

  const getPlayerResult = (match: Match): 'win' | 'draw' | 'loss' => {
    if (!match.result) return 'draw'
    const isPlayer1 = match.player1Id === user?.id
    const playerScore = isPlayer1 ? match.result.player1Score : match.result.player2Score
    const opponentScore = isPlayer1 ? match.result.player2Score : match.result.player1Score

    if (playerScore > opponentScore) return 'win'
    if (playerScore < opponentScore) return 'loss'
    return 'draw'
  }

  const getOpponentName = (match: Match): string => {
    const opponentId = match.player1Id === user?.id ? match.player2Id : match.player1Id
    return opponentNames[opponentId] || 'Загрузка...'
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <div className="mb-6 md:mb-10 animate-fade-in">
        <h1 className="text-2xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary-light to-accent-cyan bg-clip-text text-transparent mb-2 md:mb-3 flex items-center space-x-2 md:space-x-4">
          <span className="text-3xl md:text-6xl">♝</span>
          <span className="leading-tight">Партии, ожидающие подтверждения</span>
        </h1>
        <p className="text-gray-600 text-sm md:text-lg font-medium">
          Партии, которые вы предложили и они ожидают подтверждения от соперника ({waitingMatches.length})
        </p>
      </div>

      {waitingMatches.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl md:rounded-3xl shadow-2xl p-8 md:p-16 text-center border-2 border-primary/10 animate-scale-in">
          <div className="text-5xl md:text-8xl mb-4 md:mb-6">⏳</div>
          <h2 className="text-xl md:text-3xl font-bold text-primary mb-2 md:mb-3">
            Нет партий, ожидающих подтверждения
          </h2>
          <p className="text-gray-600 text-sm md:text-lg">
            Все ваши предложенные партии подтверждены или отклонены
          </p>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6 animate-slide-up">
          {waitingMatches.map(match => {
            const playerColor = getPlayerColor(match)
            const playerResult = getPlayerResult(match)
            const opponentName = getOpponentName(match)

            return (
              <div
                key={match.id}
                className="bg-gradient-to-br from-white to-blue-50 rounded-xl md:rounded-2xl shadow-2xl p-4 md:p-8 border-2 border-primary-light hover:border-primary-light/60 transition-all duration-300 hover:shadow-[0_0_40px_rgba(59,102,219,0.3)] group"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 md:space-x-4 mb-4 md:mb-6">
                      <div className="text-2xl md:text-3xl group-hover:scale-110 transition-transform">♞</div>
                      <div>
                        <div className="text-lg md:text-2xl font-bold text-primary">
                          vs {opponentName}
                        </div>
                        <span className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm text-primary-light font-semibold">
                          <Clock className="h-4 w-4 md:h-5 md:w-5" />
                          <span>Ожидает подтверждения</span>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
                      <div className="bg-white rounded-lg p-3 border border-primary/10">
                        <div className="text-xs md:text-sm text-slate-600 mb-1">Ваш цвет</div>
                        <div>
                          {playerColor === 'white' ? (
                            <span className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-bold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 border-2 border-gray-500 shadow-md">
                              ♔ Белые
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-bold bg-gradient-to-r from-gray-800 to-gray-900 text-white border-2 border-gray-500 shadow-md">
                              ♚ Черные
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-primary/10">
                        <div className="text-xs md:text-sm text-slate-600 mb-1">Результат</div>
                        <div>
                          {playerResult === 'win' ? (
                            <span className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-bold bg-green-500 text-white border-2 border-green-600 shadow-md">
                              ✓ Победа
                            </span>
                          ) : playerResult === 'loss' ? (
                            <span className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-bold bg-red-500 text-white border-2 border-red-600 shadow-md">
                              ✗ Поражение
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-bold bg-gray-400 text-white border-2 border-gray-500 shadow-md">
                              = Ничья
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-primary/10">
                        <div className="text-xs md:text-sm text-slate-600 mb-1">Счет</div>
                        <div className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-base md:text-lg font-bold bg-primary text-white border-2 border-primary-light shadow-md">
                          {match.player1Id === user.id 
                            ? `${match.result?.player1Score} : ${match.result?.player2Score}`
                            : `${match.result?.player2Score} : ${match.result?.player1Score}`
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center md:ml-6 md:mt-0">
                    <div className="text-4xl md:text-5xl text-accent-cyan animate-pulse">⏱</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


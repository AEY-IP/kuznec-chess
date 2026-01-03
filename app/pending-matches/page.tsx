'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Match, PieceColor } from '@/types'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

export default function PendingMatchesPage() {
  const { user } = useAuth()
  const [pendingMatches, setPendingMatches] = useState<Match[]>([])
  const [proposerNames, setProposerNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      // Принудительно загружаем данные при монтировании компонента
      loadPendingMatches()
    }
  }, [user])

  // Перезагружаем данные при каждом монтировании компонента (когда пользователь переходит на страницу)
  useEffect(() => {
    if (user) {
      loadPendingMatches()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Перезагружаем данные при фокусе на странице (когда пользователь возвращается на вкладку)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        loadPendingMatches()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])

  // Перезагружаем данные при видимости страницы (когда пользователь переключается на вкладку)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        loadPendingMatches()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user])

  const loadPendingMatches = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      console.log('Loading pending matches for user:', user.id)
      // Добавляем timestamp для предотвращения кеширования
      const res = await fetch(`/api/tournament/matches?userId=${user.id}&_t=${Date.now()}`)
      const data = await res.json()
      console.log('PendingMatches: Received matches:', data.matches?.length || 0)
      console.log('PendingMatches: Current user:', user.id, user.nickname || user.username)
      
      if (data.matches) {
        // Сначала проверим все матчи со статусом pending_confirmation
        const allPendingMatches = data.matches.filter((m: Match) => 
          m.status === 'result_pending_confirmation'
        )
        console.log('PendingMatches: All matches with pending status:', allPendingMatches.length, allPendingMatches)
        
        // Фильтруем матчи, где:
        // 1. Статус = result_pending_confirmation
        // 2. Текущий пользователь является участником (player1Id или player2Id)
        // 3. Результат предложен не текущим пользователем
        const pending = data.matches.filter((m: Match) => {
          const isParticipant = m.player1Id === user.id || m.player2Id === user.id
          const isPending = m.status === 'result_pending_confirmation'
          const isNotProposedByMe = m.result?.proposedBy !== user.id
          
          // Детальное логирование для каждого матча
          if (isPending) {
            console.log('PendingMatches: Checking match:', {
              id: m.id,
              player1Id: m.player1Id,
              player2Id: m.player2Id,
              status: m.status,
              proposedBy: m.result?.proposedBy,
              currentUserId: user.id,
              isParticipant,
              isPending,
              isNotProposedByMe,
              willInclude: isParticipant && isPending && isNotProposedByMe
            })
          }
          
          return isParticipant && isPending && isNotProposedByMe
        })
        console.log('PendingMatches: Filtered pending matches:', pending.length, pending)
        setPendingMatches(pending)
      } else {
        console.log('No matches in response')
        setPendingMatches([])
      }
    } catch (error) {
      console.error('Failed to load pending matches:', error)
      setPendingMatches([])
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (match: Match) => {
    try {
      const res = await fetch('/api/tournament/matches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          action: 'confirm',
        }),
      })

      if (res.ok) {
        await loadPendingMatches()
      } else {
        alert('Ошибка при подтверждении результата')
      }
    } catch (error) {
      console.error('Failed to confirm:', error)
      alert('Ошибка при подтверждении результата')
    }
  }

  const handleReject = async (match: Match) => {
    try {
      const res = await fetch('/api/tournament/matches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          action: 'reject',
        }),
      })

      if (res.ok) {
        await loadPendingMatches()
      } else {
        alert('Ошибка при отклонении результата')
      }
    } catch (error) {
      console.error('Failed to reject:', error)
      alert('Ошибка при отклонении результата')
    }
  }

  const getPlayerColor = (match: Match): PieceColor => {
    if (!match.result) return 'white'
    const isPlayer1 = match.player1Id === user?.id
    // Если текущий игрок player1, берем его цвет, иначе обратный
    if (isPlayer1) {
      return match.result.player1Color || 'white'
    } else {
      return match.result.player2Color || 'black'
    }
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
    return match.player1Id === user?.id ? match.player2Name : match.player1Name
  }

  const loadProposerNames = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (data.users) {
        const names: Record<string, string> = {}
        data.users.forEach((u: any) => {
          names[u.id] = u.nickname || u.username
        })
        setProposerNames(names)
      }
    } catch (error) {
      console.error('Failed to load proposer names:', error)
    }
  }

  useEffect(() => {
    loadProposerNames()
  }, [pendingMatches])

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
        <h1 className="text-2xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary-light to-accent-mint bg-clip-text text-transparent mb-2 md:mb-3 flex items-center space-x-2 md:space-x-4">
          <span className="text-3xl md:text-6xl">♕</span>
          <span className="leading-tight">Партии к подтверждению</span>
        </h1>
        <p className="text-gray-600 text-sm md:text-lg font-medium">
          Партии, требующие вашего подтверждения ({pendingMatches.length})
        </p>
      </div>

      {pendingMatches.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl md:rounded-3xl shadow-2xl p-8 md:p-16 text-center border-2 border-primary/10 animate-scale-in">
          <div className="text-5xl md:text-8xl mb-4 md:mb-6">♟</div>
          <h2 className="text-xl md:text-3xl font-bold text-primary mb-2 md:mb-3">
            Партий к подтверждению нет
          </h2>
          <p className="text-gray-600 text-sm md:text-lg">
            Все партии подтверждены или ожидают вашего действия
          </p>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6 animate-slide-up">
          {pendingMatches.map(match => {
            const playerColor = getPlayerColor(match)
            const playerResult = getPlayerResult(match)
            const opponentName = getOpponentName(match)

            return (
              <div
                key={match.id}
                className="bg-gradient-to-br from-white to-yellow-50 rounded-xl md:rounded-2xl shadow-2xl p-4 md:p-8 border-2 border-accent-mint hover:border-accent-mint/60 transition-all duration-300 hover:shadow-[0_0_40px_rgba(94,219,190,0.3)] group"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 md:space-x-4 mb-4 md:mb-6">
                      <div className="text-2xl md:text-3xl group-hover:scale-110 transition-transform">♜</div>
                      <div>
                        <div className="text-lg md:text-2xl font-bold text-primary">
                          vs {opponentName}
                        </div>
                        <span className="text-xs md:text-sm text-gray-600 font-medium">
                          Предложил: {match.result?.proposedBy ? proposerNames[match.result.proposedBy] || 'Неизвестно' : 'Неизвестно'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-6 mb-4 md:mb-6">
                      <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 shadow-md border border-primary/10">
                        <div className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2 font-semibold">Ваш цвет</div>
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
                      <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 shadow-md border border-primary/10">
                        <div className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2 font-semibold">Результат</div>
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
                      <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 shadow-md border border-primary/10">
                        <div className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2 font-semibold">Счет</div>
                        <div className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-base md:text-lg font-bold bg-primary text-white border-2 border-primary-light shadow-md">
                          {match.player1Id === user.id 
                            ? `${match.result?.player1Score} : ${match.result?.player2Score}`
                            : `${match.result?.player2Score} : ${match.result?.player1Score}`
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                    <button
                      onClick={() => handleConfirm(match)}
                      className="flex-1 px-4 md:px-8 py-3 md:py-4 bg-gradient-to-r from-accent-mint to-accent-cyan text-white rounded-xl hover:shadow-[0_0_30px_rgba(94,219,190,0.5)] transition-all duration-300 flex items-center justify-center space-x-2 font-bold transform hover:scale-105"
                    >
                      <CheckCircle className="h-5 w-5 md:h-6 md:w-6" />
                      <span>Согласиться</span>
                    </button>
                    <button
                      onClick={() => handleReject(match)}
                      className="flex-1 px-4 md:px-8 py-3 md:py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all duration-300 flex items-center justify-center space-x-2 font-bold transform hover:scale-105"
                    >
                      <XCircle className="h-5 w-5 md:h-6 md:w-6" />
                      <span>Отказаться</span>
                    </button>
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


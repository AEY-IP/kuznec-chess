'use client'

import { useState, useEffect } from 'react'
import { User, PieceColor, Match } from '@/types'
import { X } from 'lucide-react'

interface RecordResultModalProps {
  isOpen: boolean
  onClose: () => void
  currentUserId: string
  onSuccess?: () => void
}

export function RecordResultModal({ isOpen, onClose, currentUserId, onSuccess }: RecordResultModalProps) {
  const [opponents, setOpponents] = useState<User[]>([])
  const [selectedOpponent, setSelectedOpponent] = useState<string>('')
  const [result, setResult] = useState<'win' | 'draw' | 'loss'>('win')
  const [color, setColor] = useState<PieceColor>('white')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadOpponents()
      // Сброс формы при открытии
      setSelectedOpponent('')
      setResult('win')
      setColor('white')
      setError('')
    }
  }, [isOpen])

  const loadOpponents = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (data.users) {
        const filtered = data.users.filter((u: User) => u.id !== currentUserId && u.role === 'user')
        setOpponents(filtered)
      }
    } catch (error) {
      console.error('Failed to load opponents:', error)
    }
  }

  const findMatch = async (opponentId: string): Promise<Match | null> => {
    try {
      const res = await fetch('/api/tournament')
      const data = await res.json()
      
      if (!data.tournament) {
        return null
      }

      const tournament = data.tournament
      
      // Ищем все матчи между этими игроками в групповом этапе
      const possibleMatches = tournament.matches.filter((m: Match) => 
        m.stage === 'group' &&
        ((m.player1Id === currentUserId && m.player2Id === opponentId) ||
         (m.player1Id === opponentId && m.player2Id === currentUserId))
      ) as Match[]

      if (possibleMatches.length === 0) {
        return null
      }

      // Определяем, какой матч нужен на основе цвета
      // round 1: player1 белые, player2 черные
      // round 2: player1 черные, player2 белые
      const isPlayer1 = possibleMatches[0].player1Id === currentUserId
      
      let targetMatch: Match | null = null
      
      if (isPlayer1) {
        // Если текущий игрок - player1
        // Белые = round 1, Черные = round 2
        targetMatch = possibleMatches.find((m: Match) => 
          (color === 'white' && m.round === 1) || (color === 'black' && m.round === 2)
        ) || null
      } else {
        // Если текущий игрок - player2
        // Белые = round 2, Черные = round 1
        targetMatch = possibleMatches.find((m: Match) => 
          (color === 'white' && m.round === 2) || (color === 'black' && m.round === 1)
        ) || null
      }

      return targetMatch
    } catch (error) {
      console.error('Failed to find match:', error)
      return null
    }
  }

  const handleSubmit = async () => {
    if (!selectedOpponent) {
      setError('Выберите соперника')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Определяем очки
      let playerScore = 0
      let opponentScore = 0

      if (result === 'win') {
        playerScore = 1
        opponentScore = 0
      } else if (result === 'draw') {
        playerScore = 0.5
        opponentScore = 0.5
      } else {
        playerScore = 0
        opponentScore = 1
      }

      // Находим матч
      const match = await findMatch(selectedOpponent)
      
      if (!match) {
        setError('Матч не найден. Убедитесь, что вы играете с участником турнира.')
        setLoading(false)
        return
      }

      // Проверяем статус матча
      if (match.status === 'result_pending_confirmation') {
        if (match.result?.proposedBy === currentUserId) {
          setError('Вы уже предложили результат для этого матча. Ожидайте подтверждения.')
          setLoading(false)
          return
        } else {
          setError('Этот матч уже ожидает подтверждения от другого игрока.')
          setLoading(false)
          return
        }
      }

      if (match.status === 'confirmed') {
        setError('Этот матч уже подтвержден.')
        setLoading(false)
        return
      }

      // Определяем player1Score и player2Score
      const player1Score = match.player1Id === currentUserId ? playerScore : opponentScore
      const player2Score = match.player2Id === currentUserId ? playerScore : opponentScore
      const player1Color = match.player1Id === currentUserId ? color : (color === 'white' ? 'black' : 'white')
      const player2Color = match.player2Id === currentUserId ? color : (color === 'white' ? 'black' : 'white')

      // Отправляем результат
      const res = await fetch('/api/tournament/matches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          result: {
            player1Score,
            player2Score,
            player1Color,
            player2Color,
            gameNumber: match.round,
          },
          action: 'propose',
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        setError(errorData.error || 'Ошибка при отправке результата')
        setLoading(false)
        return
      }

      const resultData = await res.json()
      
      console.log('RecordResultModal: API Response:', resultData)
      
      if (!resultData.success && !resultData.match) {
        setError('Ошибка при сохранении результата')
        setLoading(false)
        return
      }

      // Успешно отправлено
      console.log('RecordResultModal: Result submitted successfully:', resultData.match)
      
      // Проверяем, что матч действительно обновился
      if (resultData.match && resultData.match.status === 'result_pending_confirmation') {
        console.log('RecordResultModal: Match status confirmed as pending_confirmation')
      } else {
        console.warn('RecordResultModal: Match status is not pending_confirmation:', resultData.match?.status)
      }
      
      // Вызываем callback для обновления данных
      if (onSuccess) {
        onSuccess()
      }
      
      // Отправляем событие для обновления других компонентов
      if (typeof window !== 'undefined') {
        console.log('RecordResultModal: Dispatching match-updated event')
        
        // Отправляем CustomEvent
        const customEvent = new CustomEvent('match-updated', { 
          detail: { matchId: match.id },
          bubbles: true,
          cancelable: true
        })
        window.dispatchEvent(customEvent)
        
        // Также отправляем обычное событие для совместимости
        const simpleEvent = new Event('match-updated', {
          bubbles: true,
          cancelable: true
        })
        window.dispatchEvent(simpleEvent)
        
        // Также используем localStorage для синхронизации между вкладками
        localStorage.setItem('match-updated', JSON.stringify({ matchId: match.id, timestamp: Date.now() }))
        
        console.log('RecordResultModal: Events dispatched, localStorage updated')
      }
      
      // Небольшая задержка перед закрытием
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Закрываем модальное окно
      onClose()
    } catch (error) {
      console.error('Failed to submit result:', error)
      setError('Ошибка при отправке результата')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Записать результат</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Выбор соперника */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Соперник
            </label>
            <select
              value={selectedOpponent}
              onChange={(e) => setSelectedOpponent(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="">Выберите соперника</option>
              {opponents.map(opponent => (
                <option key={opponent.id} value={opponent.id}>
                  {opponent.nickname || opponent.username}
                </option>
              ))}
            </select>
          </div>

          {/* Результат */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Результат
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setResult('win')}
                className={`flex-1 py-2 px-4 rounded-lg border ${
                  result === 'win'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                Победа
              </button>
              <button
                onClick={() => setResult('draw')}
                className={`flex-1 py-2 px-4 rounded-lg border ${
                  result === 'draw'
                    ? 'bg-yellow-600 text-white border-yellow-600'
                    : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                Ничья
              </button>
              <button
                onClick={() => setResult('loss')}
                className={`flex-1 py-2 px-4 rounded-lg border ${
                  result === 'loss'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                Поражение
              </button>
            </div>
          </div>

          {/* Цвет */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Цвет, которым вы играли
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setColor('white')}
                className={`flex-1 py-2 px-4 rounded-lg border ${
                  color === 'white'
                    ? 'bg-slate-100 dark:bg-slate-700 border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                Белые
              </button>
              <button
                onClick={() => setColor('black')}
                className={`flex-1 py-2 px-4 rounded-lg border ${
                  color === 'black'
                    ? 'bg-slate-800 dark:bg-slate-600 border-primary-500 text-white'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                Черные
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

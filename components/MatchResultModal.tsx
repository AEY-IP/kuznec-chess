'use client'

import { useState } from 'react'
import { Match } from '@/types'
import { X } from 'lucide-react'

interface MatchResultModalProps {
  match: Match
  isOpen: boolean
  onClose: () => void
  onSubmit: (result: { player1Score: number; player2Score: number }, action?: string) => void
  onConfirm?: () => void
  onReject?: () => void
  currentUserId?: string
}

export function MatchResultModal({
  match,
  isOpen,
  onClose,
  onSubmit,
  onConfirm,
  onReject,
  currentUserId,
}: MatchResultModalProps) {
  const [player1Score, setPlayer1Score] = useState(match.result?.player1Score ?? 0)
  const [player2Score, setPlayer2Score] = useState(match.result?.player2Score ?? 0)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const isPending = match.status === 'result_pending_confirmation'
  // Нужно подтверждение, если результат предложен другим игроком (не текущим пользователем)
  // и текущий пользователь является участником матча
  const isParticipant = currentUserId && (match.player1Id === currentUserId || match.player2Id === currentUserId)
  const needsConfirmation = isPending && match.result && match.result.proposedBy && 
    currentUserId && match.result.proposedBy !== currentUserId && isParticipant

  const handleScoreChange = (player: 1 | 2, value: number) => {
    if (player === 1) {
      setPlayer1Score(value)
      setPlayer2Score(1 - value) // В шахматах сумма всегда 1
    } else {
      setPlayer2Score(value)
      setPlayer1Score(1 - value)
    }
  }

  const handleSubmit = async () => {
    if (player1Score + player2Score !== 1) {
      alert('Сумма очков должна быть равна 1 (победа + поражение или ничья)')
      return
    }
    setLoading(true)
    await onSubmit({ player1Score, player2Score })
    setLoading(false)
    onClose()
  }

  const handleConfirm = async () => {
    if (onConfirm) {
      setLoading(true)
      await onConfirm()
      setLoading(false)
      onClose()
    }
  }

  const handleReject = async () => {
    if (onReject) {
      setLoading(true)
      await onReject()
      setLoading(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Результат матча</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">
              {match.player1Name} vs {match.player2Name}
            </div>
          </div>

          {needsConfirmation ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
                  Результат предложен соперником:
                </p>
                <div className="text-lg font-semibold">
                  {match.player1Name}: {match.result?.player1Score} - {match.result?.player2Score} :{match.player2Name}
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Подтвердить
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Отклонить
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {match.player1Name}
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleScoreChange(1, 1)}
                    className={`flex-1 py-2 px-4 rounded-lg border ${
                      player1Score === 1
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Победа (1)
                  </button>
                  <button
                    onClick={() => handleScoreChange(1, 0.5)}
                    className={`flex-1 py-2 px-4 rounded-lg border ${
                      player1Score === 0.5
                        ? 'bg-yellow-600 text-white border-yellow-600'
                        : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Ничья (0.5)
                  </button>
                  <button
                    onClick={() => handleScoreChange(1, 0)}
                    className={`flex-1 py-2 px-4 rounded-lg border ${
                      player1Score === 0
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Поражение (0)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {match.player2Name}
                </label>
                <div className="text-slate-600 dark:text-slate-400">
                  Автоматически: {player2Score}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Отправка...' : isPending ? 'Изменить результат' : 'Отправить результат'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


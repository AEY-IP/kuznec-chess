'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface NicknameModalProps {
  isOpen: boolean
  currentNickname?: string
  onSave: (nickname: string) => Promise<void>
}

export function NicknameModal({ isOpen, currentNickname, onSave }: NicknameModalProps) {
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setNickname(currentNickname || '')
      setError('')
    }
  }, [isOpen, currentNickname])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!nickname.trim()) {
      setError('Никнейм не может быть пустым')
      setLoading(false)
      return
    }

    try {
      await onSave(nickname.trim())
    } catch (err) {
      setError('Ошибка при сохранении никнейма')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Выберите никнейм
          </h2>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Этот никнейм будет отображаться во всех турнирах. Вы можете изменить его позже в профиле.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Никнейм
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              maxLength={50}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder="Введите ваш никнейм"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !nickname.trim()}
              className="flex-1 bg-primary-600 text-white py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


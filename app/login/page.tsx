'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Trophy } from 'lucide-react'
import { NicknameModal } from '@/components/NicknameModal'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showNicknameModal, setShowNicknameModal] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<any>(null)
  const router = useRouter()
  const { setUser } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Ошибка входа')
        return
      }

      // Если у пользователя нет никнейма, показываем модальное окно
      if (!data.user.nickname) {
        setLoggedInUser(data.user)
        setShowNicknameModal(true)
      } else {
        setUser(data.user)
        router.push('/home')
      }
    } catch (err) {
      setError('Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  const handleNicknameSave = async (nickname: string) => {
    try {
      const res = await fetch('/api/users/nickname', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      })

      if (!res.ok) {
        throw new Error('Failed to save nickname')
      }

      const data = await res.json()
      setUser(data.user)
      setShowNicknameModal(false)
      router.push('/home')
    } catch (err) {
      throw err
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <Trophy className="h-16 w-16 mx-auto text-primary-600 mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Вход в систему</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Выберите пользователя для входа</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900 font-medium transition-all duration-300 hover:border-primary/50"
              placeholder="email@example.com"
            />
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl font-medium animate-scale-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-gradient-to-r from-primary via-primary-light to-accent-mint hover:shadow-[0_0_30px_rgba(94,219,190,0.5)] text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t-2 border-gray-100">
          <p className="text-sm font-semibold text-gray-600 mb-4 text-center">
            Доступные пользователи для тестирования:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {['nickolay@chess.com', 'sergey@chess.com', 'elizabeth@chess.com', 'pavel@chess.com', 'roman@chess.com', 'polina@chess.com', 'alexander@chess.com', 'alexey@chess.com'].map((testEmail) => (
              <button
                key={testEmail}
                type="button"
                onClick={() => setEmail(testEmail)}
                className="px-3 py-2 text-xs text-gray-700 bg-gray-50 hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent-mint/10 hover:text-primary rounded-lg transition-all duration-300 font-medium border border-gray-200 hover:border-primary/30 transform hover:scale-105"
              >
                {testEmail.split('@')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <NicknameModal
        isOpen={showNicknameModal}
        onSave={handleNicknameSave}
      />
    </div>
  )
}


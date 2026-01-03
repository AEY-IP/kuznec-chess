'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { ChessPieces } from '@/components/ChessIcons'
import { NicknameModal } from '@/components/NicknameModal'
import Image from 'next/image'

// Конфигурация сторис
const stories = [
  {
    id: 1,
    image: '/stories/chemp.jpeg',
    caption: 'Вы спросите, почему я такой счастливый? Я выиграл прошлый турнир "Оправдания после мата". В этом году я буду защищать титул и снова всех перееду.'
  },
  {
    id: 2,
    image: '/stories/looser.jpeg',
    caption: 'Вы спросите, почему я такой грустный? Я проиграл Коле в прошлом турнире в финале, потому что он реально жёсткий чел и хорошо готовился, а меня к турниру готовил астролог. Больше я таких ошибок не допущу. Готовьтесь лучше, ребята!'
  }
]

const STORY_DURATION = 10000 // 10 секунд

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showNicknameModal, setShowNicknameModal] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<any>(null)
  const [currentStory, setCurrentStory] = useState(0)
  const [progress, setProgress] = useState(0)
  const router = useRouter()
  const { setUser } = useAuth()

  // Автопереключение сторис
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          return 0
        }
        return prev + (100 / (STORY_DURATION / 100))
      })
    }, 100)

    const storyInterval = setInterval(() => {
      setCurrentStory(prev => {
        const next = (prev + 1) % stories.length
        setProgress(0)
        return next
      })
    }, STORY_DURATION)

    return () => {
      clearInterval(progressInterval)
      clearInterval(storyInterval)
    }
  }, [])

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

  const handleQuickLogin = (testEmail: string) => {
    setEmail(testEmail)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Левая часть - Форма входа */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-4 py-8 md:py-12 bg-gradient-to-br from-primary-900 to-primary-700">
        {/* Слайдер сторис (мобильная версия - сверху) */}
        <div className="lg:hidden mb-6 w-full max-w-sm">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white">
            {/* Прогресс-бары сверху */}
            <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-3">
              {stories.map((_, index) => (
                <div
                  key={index}
                  className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-white rounded-full transition-all duration-100"
                    style={{
                      width: index === currentStory
                        ? `${progress}%`
                        : index < currentStory
                        ? '100%'
                        : '0%'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Изображение */}
            <div className="relative aspect-[9/16] bg-gradient-to-br from-primary/20 to-accent-mint/20">
              <Image
                src={stories[currentStory].image}
                alt={stories[currentStory].caption}
                fill
                className="object-cover"
                priority
              />

              {/* Подпись */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-4 pt-12">
                <p className="text-white text-sm leading-relaxed font-semibold text-left drop-shadow-lg">
                  {stories[currentStory].caption}
                </p>
              </div>
            </div>

            {/* Индикаторы для переключения */}
            <div className="absolute left-0 right-0 top-16 bottom-16 flex">
              <button
                onClick={() => {
                  setCurrentStory(prev => (prev - 1 + stories.length) % stories.length)
                  setProgress(0)
                }}
                className="flex-1 cursor-pointer"
                aria-label="Предыдущая история"
              />
              <button
                onClick={() => {
                  setCurrentStory(prev => (prev + 1) % stories.length)
                  setProgress(0)
                }}
                className="flex-1 cursor-pointer"
                aria-label="Следующая история"
              />
            </div>
          </div>

          {/* Стрелочка вниз - подсказка */}
          <div className="flex justify-center mt-4 animate-bounce">
            <svg 
              className="w-8 h-8 text-white/70" 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
        </div>

        <div className="max-w-md w-full">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-8 border-2 border-white/20">
            <div className="text-center mb-6 md:mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary to-primary-light rounded-2xl mb-4 md:mb-6 animate-chess-glow">
                <ChessPieces.King className="text-5xl md:text-6xl text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-primary-light to-accent-mint bg-clip-text text-transparent mb-2">
                Вход в систему
              </h1>
              <p className="text-gray-600 text-sm md:text-base font-medium">Шахматный турнир 2026</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
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

            <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t-2 border-gray-100">
              <p className="text-xs md:text-sm font-bold text-gray-600 mb-3 md:mb-4 text-center">
                Быстрый вход:
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
        </div>
      </div>

      {/* Правая часть - Слайдер сторис (десктоп) */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-12">
        <div className="max-w-lg w-full">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white">
            {/* Прогресс-бары сверху */}
            <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-3">
              {stories.map((_, index) => (
                <div
                  key={index}
                  className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-white rounded-full transition-all duration-100"
                    style={{
                      width: index === currentStory
                        ? `${progress}%`
                        : index < currentStory
                        ? '100%'
                        : '0%'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Изображение */}
            <div className="relative aspect-[9/16] bg-gradient-to-br from-primary/20 to-accent-mint/20">
              <Image
                src={stories[currentStory].image}
                alt={stories[currentStory].caption}
                fill
                className="object-cover"
                priority
              />

              {/* Подпись */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-6 pt-16">
                <p className="text-white text-base leading-relaxed font-semibold text-left drop-shadow-lg">
                  {stories[currentStory].caption}
                </p>
              </div>
            </div>

            {/* Индикаторы для переключения */}
            <div className="absolute left-0 right-0 top-20 bottom-20 flex">
              <button
                onClick={() => {
                  setCurrentStory(prev => (prev - 1 + stories.length) % stories.length)
                  setProgress(0)
                }}
                className="flex-1 cursor-pointer"
                aria-label="Предыдущая история"
              />
              <button
                onClick={() => {
                  setCurrentStory(prev => (prev + 1) % stories.length)
                  setProgress(0)
                }}
                className="flex-1 cursor-pointer"
                aria-label="Следующая история"
              />
            </div>
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

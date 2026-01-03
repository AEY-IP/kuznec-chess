'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, Home, Menu, X } from 'lucide-react'
import { ChessPieces } from './ChessIcons'
import { useState } from 'react'

export function Navbar() {
  const { user, setUser } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/login')
  }

  // Скрываем Navbar на странице логина
  if (pathname === '/login') {
    return null
  }

  return (
    <nav className="bg-gradient-to-r from-primary-900 via-primary to-primary-light shadow-2xl border-b-4 border-accent-mint relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <div className="flex items-center space-x-4 md:space-x-8">
            <Link href="/home" className="flex items-center space-x-2 md:space-x-3 group">
              <div className="transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <ChessPieces.King className="text-3xl md:text-4xl text-accent-mint drop-shadow-[0_0_15px_rgba(94,219,190,0.6)]" />
              </div>
              <span className="font-bold text-lg md:text-2xl text-white drop-shadow-lg">
                Шахматный турнир
              </span>
            </Link>
            {user && (
              <div className="hidden md:flex items-center space-x-6 h-full">
                <Link 
                  href="/home" 
                  className="flex items-center space-x-2 text-white/90 hover:text-accent-mint transition-all duration-300 font-semibold group h-full"
                >
                  <Home className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span className="leading-none">Главная</span>
                </Link>
                <Link 
                  href="/group-stage" 
                  className="flex items-center text-white/90 hover:text-accent-mint transition-all duration-300 font-semibold relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-accent-mint hover:after:w-full after:transition-all after:duration-300 h-full"
                >
                  <span className="leading-none">Групповой тур</span>
                </Link>
                <Link 
                  href="/final-stage" 
                  className="flex items-center text-white/90 hover:text-accent-mint transition-all duration-300 font-semibold relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-accent-mint hover:after:w-full after:transition-all after:duration-300 h-full"
                >
                  <span className="leading-none">Финальный тур</span>
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            {user ? (
              <>
                {/* Имя пользователя - скрыто на мобильных */}
                <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-accent-mint/30 shadow-lg">
                  <ChessPieces.Pawn className="text-xl text-accent-mint" />
                  <span className="text-white font-semibold">
                    {user.nickname || user.username}
                  </span>
                </div>
                
                {/* Кнопка выхода - только десктоп */}
                <button
                  onClick={handleLogout}
                  className="hidden md:flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg hover:shadow-red-500/50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Выйти</span>
                </button>

                {/* Бургер меню - только мобильные */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-white hover:text-accent-mint transition-colors"
                  aria-label="Меню"
                >
                  {mobileMenuOpen ? (
                    <X className="h-7 w-7" />
                  ) : (
                    <Menu className="h-7 w-7" />
                  )}
                </button>
              </>
            ) : (
              <Link 
                href="/login" 
                className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-accent-mint to-accent-cyan text-primary-900 font-bold rounded-xl hover:shadow-[0_0_25px_rgba(94,219,190,0.6)] transition-all duration-300 transform hover:scale-105 text-sm md:text-base"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Мобильное меню */}
      {user && mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-primary-900/98 backdrop-blur-lg shadow-2xl border-b-2 border-accent-mint/30 z-50 animate-slide-down">
          <div className="px-4 py-6 space-y-2">
            {/* Имя пользователя */}
            <div className="flex items-center space-x-3 px-4 py-3 bg-white/10 rounded-xl border border-accent-mint/30 mb-4">
              <ChessPieces.Pawn className="text-2xl text-accent-mint" />
              <span className="text-white font-bold text-lg">
                {user.nickname || user.username}
              </span>
            </div>

            {/* Навигационные ссылки */}
            <Link 
              href="/home" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 text-white hover:bg-accent-mint/20 rounded-xl transition-all duration-300 font-semibold"
            >
              <Home className="h-5 w-5 text-accent-mint" />
              <span>Главная</span>
            </Link>

            <Link 
              href="/group-stage" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 text-white hover:bg-accent-mint/20 rounded-xl transition-all duration-300 font-semibold"
            >
              <span className="text-xl text-accent-mint">♖</span>
              <span>Групповой тур</span>
            </Link>

            <Link 
              href="/final-stage" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 text-white hover:bg-accent-mint/20 rounded-xl transition-all duration-300 font-semibold"
            >
              <span className="text-xl text-accent-mint">♕</span>
              <span>Финальный тур</span>
            </Link>

            {/* Кнопка выхода */}
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                handleLogout()
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-300 font-semibold shadow-lg mt-4"
            >
              <LogOut className="h-5 w-5" />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}


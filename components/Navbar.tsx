'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'
import { LogOut, Home } from 'lucide-react'
import { ChessPieces } from './ChessIcons'

export function Navbar() {
  const { user, setUser } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/login')
  }

  return (
    <nav className="bg-gradient-to-r from-primary-900 via-primary to-primary-light shadow-2xl border-b-4 border-accent-mint">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center space-x-8">
            <Link href="/home" className="flex items-center space-x-3 group">
              <div className="transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <ChessPieces.King className="text-4xl text-accent-mint drop-shadow-[0_0_15px_rgba(94,219,190,0.6)]" />
              </div>
              <span className="font-bold text-2xl text-white drop-shadow-lg">
                Шахматный турнир
              </span>
            </Link>
            {user && (
              <div className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/home" 
                  className="flex items-center space-x-2 text-white/90 hover:text-accent-mint transition-all duration-300 font-semibold group"
                >
                  <Home className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span>Главная</span>
                </Link>
                <Link 
                  href="/group-stage" 
                  className="text-white/90 hover:text-accent-mint transition-all duration-300 font-semibold relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-accent-mint hover:after:w-full after:transition-all after:duration-300"
                >
                  Групповой тур
                </Link>
                <Link 
                  href="/final-stage" 
                  className="text-white/90 hover:text-accent-mint transition-all duration-300 font-semibold relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-accent-mint hover:after:w-full after:transition-all after:duration-300"
                >
                  Финальный тур
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-accent-mint/30 shadow-lg">
                  <ChessPieces.Pawn className="text-xl text-accent-mint" />
                  <span className="text-white font-semibold">
                    {user.nickname || user.username}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg hover:shadow-red-500/50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Выйти</span>
                </button>
              </>
            ) : (
              <Link 
                href="/login" 
                className="px-6 py-3 bg-gradient-to-r from-accent-mint to-accent-cyan text-primary-900 font-bold rounded-xl hover:shadow-[0_0_25px_rgba(94,219,190,0.6)] transition-all duration-300 transform hover:scale-105"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}


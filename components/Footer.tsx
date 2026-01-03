'use client'

import { usePathname } from 'next/navigation'

export function Footer() {
  const pathname = usePathname()
  
  // Не показываем футер на странице логина
  if (pathname === '/login') {
    return null
  }

  return (
    <footer className="mt-16 py-8 bg-gradient-to-r from-primary via-primary-light to-accent-cyan border-0 shadow-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center space-x-3">
          {/* Значок кузнечика */}
          <div className="text-4xl animate-bounce" style={{ animationDuration: '2s' }}>
            🦗
          </div>
          
          {/* Текст */}
          <p className="text-white font-bold text-lg">
            powered by <span className="text-accent-mint">Kuznec production</span>
          </p>
        </div>
      </div>
    </footer>
  )
}


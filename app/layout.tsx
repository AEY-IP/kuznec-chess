import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { AuthProvider } from '@/components/AuthProvider'
import { InitProvider } from '@/components/InitProvider'
import { Footer } from '@/components/Footer'

const manrope = Manrope({ 
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-manrope',
})

export const metadata: Metadata = {
  title: 'Шахматный турнир',
  description: 'Система учета шахматного турнира',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={`${manrope.className} antialiased`}>
        <InitProvider>
          <AuthProvider>
            <Navbar />
            <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </InitProvider>
      </body>
    </html>
  )
}


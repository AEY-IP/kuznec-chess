'use client'

export function InitProvider({ children }: { children: React.ReactNode }) {
  // Инициализация теперь происходит автоматически на сервере при первом API запросе
  return <>{children}</>
}


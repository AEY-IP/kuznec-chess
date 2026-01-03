import { NextResponse } from 'next/server'
import { storage, initializeTestData } from '@/lib/storage'

export async function GET() {
  // Автоматическая инициализация данных при первом запросе
  if (storage.getAllUsers().length === 0) {
    initializeTestData()
  }

  const users = storage.getAllUsers()
  return NextResponse.json({ users })
}


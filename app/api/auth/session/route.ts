import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { storage, initializeTestData } from '@/lib/storage'

export async function GET() {
  // Автоматическая инициализация данных при первом запросе
  if (storage.getAllUsers().length === 0) {
    initializeTestData()
  }

  const user = await getServerSession()
  return NextResponse.json({ user })
}


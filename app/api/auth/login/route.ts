import { NextRequest, NextResponse } from 'next/server'
import { storage, initializeTestData } from '@/lib/storage'
import { setServerSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Автоматическая инициализация данных при первом запросе
    if (storage.getAllUsers().length === 0) {
      initializeTestData()
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const user = storage.getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await setServerSession(user.id)

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


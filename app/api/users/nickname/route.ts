import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/lib/storage'
import { getServerSession } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { nickname } = await request.json()

    if (!nickname || nickname.trim().length === 0) {
      return NextResponse.json({ error: 'Nickname required' }, { status: 400 })
    }

    const user = storage.getUser(session.id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    user.nickname = nickname.trim()
    storage.updateUser(user)

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


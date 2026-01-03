import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/lib/db-adapter'
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

    const user = await db.getUser(session.id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    user.nickname = nickname.trim()
    await db.updateUser(user)

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Nickname update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


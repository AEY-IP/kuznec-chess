import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/lib/db-adapter'
import { getServerSession } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    console.log('=== PUT /api/users/nickname START ===')
    
    const session = await getServerSession()
    console.log('Session:', session ? session.id : 'NO SESSION')
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { nickname } = await request.json()
    console.log('Received nickname:', nickname)

    if (!nickname || nickname.trim().length === 0) {
      return NextResponse.json({ error: 'Nickname required' }, { status: 400 })
    }

    const user = await db.getUser(session.id)
    console.log('User before update:', { id: user?.id, username: user?.username, nickname: user?.nickname })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    user.nickname = nickname.trim()
    console.log('User after setting nickname:', { id: user.id, username: user.username, nickname: user.nickname })
    
    const updatedUser = await db.updateUser(user)
    console.log('User after db.updateUser:', { id: updatedUser.id, username: updatedUser.username, nickname: updatedUser.nickname })

    // Проверяем что никнейм действительно сохранился
    const verifyUser = await db.getUser(session.id)
    console.log('User verification from DB:', { id: verifyUser?.id, username: verifyUser?.username, nickname: verifyUser?.nickname })
    console.log('=== PUT /api/users/nickname END ===')

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Nickname update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


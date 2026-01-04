import { NextResponse } from 'next/server'
import * as db from '@/lib/db-adapter'

export async function GET() {
  try {
    const users = await db.getAllUsers()
    
    const usersStatus = users.map(u => ({
      email: u.email,
      username: u.username,
      nickname: u.nickname || '❌ НЕ ВЫБРАН',
      status: u.nickname ? '✅ Готов' : '⏳ Ждем никнейм',
    }))
    
    const readyCount = users.filter(u => u.nickname).length
    const waitingCount = users.filter(u => !u.nickname).length
    
    return NextResponse.json({
      summary: {
        total: users.length,
        ready: readyCount,
        waiting: waitingCount,
      },
      users: usersStatus,
      message: readyCount === users.length 
        ? '🎉 Все участники готовы! Можно начинать турнир!'
        : `⏳ Ждем еще ${waitingCount} участников`
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check users',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}


import { NextResponse } from 'next/server'
import * as db from '@/lib/db-adapter'

export async function GET() {
  try {
    // Проверяем какое хранилище используется
    const isUsingDatabase = !!process.env.DATABASE_URL
    
    // Получаем всех пользователей
    const users = await db.getAllUsers()
    
    // Получаем турнир
    const tournament = await db.getCurrentTournament()
    
    // Собираем информацию о никнеймах
    const userInfo = users.map(u => ({
      id: u.id,
      email: u.email,
      username: u.username,
      nickname: u.nickname || null,
      hasNickname: !!u.nickname,
    }))
    
    // Подсчитываем матчи
    const confirmedMatches = tournament?.matches.filter(m => m.status === 'confirmed').length || 0
    const pendingMatches = tournament?.matches.filter(m => m.status === 'pending').length || 0
    const totalMatches = tournament?.matches.length || 0
    
    return NextResponse.json({
      storage: isUsingDatabase ? 'PostgreSQL (Railway)' : 'In-Memory',
      databaseUrl: process.env.DATABASE_URL ? 'Connected' : 'Not set',
      users: {
        total: users.length,
        withNicknames: userInfo.filter(u => u.hasNickname).length,
        details: userInfo,
      },
      matches: {
        total: totalMatches,
        confirmed: confirmedMatches,
        pending: pendingMatches,
      },
      tournament: {
        stage: tournament?.stage,
        groupStageCompleted: tournament?.groupStageCompleted,
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get DB info',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}


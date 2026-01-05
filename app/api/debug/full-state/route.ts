import { NextResponse } from 'next/server'
import * as db from '@/lib/db-adapter'

export async function GET() {
  try {
    // Проверяем переменную окружения
    const hasDbUrl = !!process.env.DATABASE_URL
    const dbUrlPreview = process.env.DATABASE_URL 
      ? process.env.DATABASE_URL.substring(0, 30) + '...' 
      : 'NOT SET'
    
    // Получаем турнир
    const tournament = await db.getCurrentTournament()
    
    if (!tournament) {
      return NextResponse.json({
        error: 'Tournament not found',
        storage: hasDbUrl ? 'PostgreSQL' : 'In-Memory',
        databaseUrl: dbUrlPreview,
      })
    }
    
    // Группируем матчи по статусам
    const matchesByStatus = {
      pending: tournament.matches.filter(m => m.status === 'pending').length,
      result_pending_confirmation: tournament.matches.filter(m => m.status === 'result_pending_confirmation').length,
      confirmed: tournament.matches.filter(m => m.status === 'confirmed').length,
    }
    
    // Последние 10 обновленных матчей
    const recentMatches = tournament.matches
      .filter(m => m.status !== 'pending')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10)
      .map(m => ({
        id: m.id,
        players: `${m.player1Name} vs ${m.player2Name}`,
        round: m.round,
        status: m.status,
        result: m.result ? `${m.result.player1Score}:${m.result.player2Score}` : null,
        proposedBy: m.result?.proposedBy,
        updatedAt: m.updatedAt,
      }))
    
    return NextResponse.json({
      environment: {
        storage: hasDbUrl ? 'PostgreSQL (Railway)' : 'In-Memory',
        databaseUrl: dbUrlPreview,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
      },
      tournament: {
        id: tournament.id,
        stage: tournament.stage,
        totalMatches: tournament.matches.length,
      },
      matchesByStatus,
      recentActivity: recentMatches,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get full state',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
}


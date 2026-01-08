import { NextResponse } from 'next/server'
import * as db from '@/lib/db-adapter'

// Отключаем кеширование Next.js
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const users = await db.getAllUsers()
  return NextResponse.json({ users })
}


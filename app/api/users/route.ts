import { NextResponse } from 'next/server'
import * as db from '@/lib/db-adapter'

// Отключаем кеширование Next.js
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const users = await db.getAllUsers()
  return NextResponse.json({ users }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'CDN-Cache-Control': 'no-store',
    }
  })
}


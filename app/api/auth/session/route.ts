import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'

// Отключаем кеширование Next.js
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const user = await getServerSession()
  return NextResponse.json({ user })
}


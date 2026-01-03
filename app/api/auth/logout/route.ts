import { NextResponse } from 'next/server'
import { clearServerSession } from '@/lib/auth'

export async function POST() {
  await clearServerSession()
  return NextResponse.json({ success: true })
}


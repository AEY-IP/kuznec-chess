import { NextResponse } from 'next/server'
import { initializeTestData } from '@/lib/storage'

export async function POST() {
  try {
    initializeTestData()
    return NextResponse.json({ success: true, message: 'Test data initialized' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to initialize' }, { status: 500 })
  }
}


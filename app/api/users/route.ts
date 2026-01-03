import { NextResponse } from 'next/server'
import * as db from '@/lib/db-adapter'

export async function GET() {
  const users = await db.getAllUsers()
  return NextResponse.json({ users })
}


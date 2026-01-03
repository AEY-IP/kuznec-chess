import { cookies } from 'next/headers'
import { User } from '@/types'
import * as db from './db-adapter'

export async function getServerSession(): Promise<User | null> {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  
  if (!userId) return null
  
  return await db.getUser(userId) || null
}

export async function setServerSession(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set('userId', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearServerSession() {
  const cookieStore = await cookies()
  cookieStore.delete('userId')
}


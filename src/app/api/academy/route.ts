import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/auth-options'
import prisma from '@/lib/prisma'
import { logApiRequest, logApiError } from '@/lib/logger'

export async function GET(request: NextRequest) {
  logApiRequest(request, 'GET academy')
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const academy = await prisma.academy.findUnique({
      where: {
        id: session.user.academyId || undefined,
      },
      select: {
        id: true,
        name: true,
      },
    })

    if (!academy) {
      return NextResponse.json({ error: 'Academy not found' }, { status: 404 })
    }

    return NextResponse.json(academy)
  } catch (error) {
    logApiError(request, error, { message: 'Failed to fetch academy' })
    return NextResponse.json(
      { error: 'Failed to fetch academy' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  logApiRequest(request, 'PATCH academy')
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name } = body

    const updatedAcademy = await prisma.academy.update({
      where: {
        id: session.user.academyId || undefined,
      },
      data: {
        name,
      },
    })

    return NextResponse.json(updatedAcademy)
  } catch (error) {
    logApiError(request, error, { message: 'Failed to update academy' })
    return NextResponse.json(
      { error: 'Failed to update academy' },
      { status: 500 }
    )
  }
}
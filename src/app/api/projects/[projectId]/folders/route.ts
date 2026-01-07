import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const body = await request.json()
    const { name, path, parentId } = body

    // Create folder in database
    const folder = await prisma.folder.create({
      data: {
        name,
        path,
        projectId,
        parentId: parentId || null,
      },
    })

    return NextResponse.json({ folder }, { status: 201 })
  } catch (error) {
    console.error('Failed to create folder:', error)
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

    const folders = await prisma.folder.findMany({
      where: { projectId },
      orderBy: { path: 'asc' },
    })

    return NextResponse.json({ folders })
  } catch (error) {
    console.error('Failed to fetch folders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    )
  }
}

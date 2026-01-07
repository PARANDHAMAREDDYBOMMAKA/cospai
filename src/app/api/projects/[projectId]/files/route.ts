import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { storage } from '@/lib/storage'
import fs from 'fs/promises'
import path from 'path'

// GET /api/projects/[projectId]/files - List all files in project
export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params

    // Check access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        access: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const hasAccess =
      project.ownerId === session.user?.id || project.access.some((a) => a.userId === session.user?.id)

    if (!hasAccess && !project.isPublic) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const files = await prisma.file.findMany({
      where: {
        projectId: projectId,
      },
      orderBy: {
        path: 'asc',
      },
    })

    return NextResponse.json({ files })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/projects/[projectId]/files - Create a new file
export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params

    // Check access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        access: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const hasWriteAccess =
      project.ownerId === session.user?.id ||
      project.access.some((a) => a.userId === session.user?.id && (a.role === 'OWNER' || a.role === 'EDITOR'))

    if (!hasWriteAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, path: filePath, content, language, folderId } = body

    if (!name || !filePath) {
      return NextResponse.json({ error: 'Name and path are required' }, { status: 400 })
    }

    // Check if file already exists
    const existingFile = await prisma.file.findUnique({
      where: {
        projectId_path: {
          projectId: projectId,
          path: filePath,
        },
      },
    })

    if (existingFile) {
      return NextResponse.json({ error: 'File already exists at this path' }, { status: 409 })
    }

    const fileContent = content || ''
    const fileSize = Buffer.byteLength(fileContent, 'utf8')

    // Create file in workspace directory
    const workspacePath = path.join(process.cwd(), 'workspaces', projectId)
    const fullFilePath = path.join(workspacePath, filePath)
    const fileDir = path.dirname(fullFilePath)

    // Ensure directory exists
    await fs.mkdir(fileDir, { recursive: true })

    // Write file to disk
    await fs.writeFile(fullFilePath, fileContent, 'utf8')

    // If file is large (>1MB), store in R2
    let storageUrl = null
    let dbContent = fileContent

    if (fileSize > 1024 * 1024) {
      const storageKey = `projects/${projectId}/${filePath}`
      storageUrl = await storage.uploadFile(storageKey, fileContent, 'text/plain')
      dbContent = '' // Don't store large files in database
    }

    const file = await prisma.file.create({
      data: {
        name,
        path: filePath,
        content: dbContent,
        size: fileSize,
        language,
        storageUrl,
        projectId: projectId,
        folderId,
      },
    })

    return NextResponse.json({ file }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

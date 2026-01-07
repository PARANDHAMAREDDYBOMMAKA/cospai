import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { storage } from '@/lib/storage'
import fs from 'fs/promises'
import path from 'path'

// GET /api/projects/[projectId]/files/[fileId] - Get file content
export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string; fileId: string }> }) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, fileId } = await params

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        project: {
          include: {
            access: true,
          },
        },
      },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check access
    const hasAccess =
      file.project.ownerId === session.user?.id ||
      file.project.access.some((a) => a.userId === session.user?.id) ||
      file.project.isPublic

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If file is stored in R2, fetch from there
    let content = file.content
    if (file.storageUrl && !content) {
      const storageKey = `projects/${projectId}/${file.path}`
      content = (await storage.getFile(storageKey)) || ''
    }

    return NextResponse.json({
      file: {
        ...file,
        content,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/projects/[projectId]/files/[fileId] - Update file
export async function PUT(req: NextRequest, { params }: { params: Promise<{ projectId: string; fileId: string }> }) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, fileId } = await params

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        project: {
          include: {
            access: true,
          },
        },
      },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check write access
    const hasWriteAccess =
      file.project.ownerId === session.user?.id ||
      file.project.access.some((a) => a.userId === session.user?.id && (a.role === 'OWNER' || a.role === 'EDITOR'))

    if (!hasWriteAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { content, name, language } = body

    const fileSize = content ? Buffer.byteLength(content, 'utf8') : file.size

    // Update file in workspace directory
    if (content !== undefined) {
      const workspacePath = path.join(process.cwd(), 'workspaces', projectId)
      const fullFilePath = path.join(workspacePath, file.path)
      const fileDir = path.dirname(fullFilePath)

      // Ensure directory exists
      await fs.mkdir(fileDir, { recursive: true })

      // Write file to disk
      await fs.writeFile(fullFilePath, content, 'utf8')
    }

    // Handle large files
    let storageUrl = file.storageUrl
    let dbContent = content

    if (fileSize > 1024 * 1024) {
      const storageKey = `projects/${projectId}/${file.path}`
      storageUrl = await storage.uploadFile(storageKey, content, 'text/plain')
      dbContent = ''
    }

    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        name,
        content: dbContent,
        size: fileSize,
        language,
        storageUrl,
      },
    })

    return NextResponse.json({ file: updatedFile })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/projects/[projectId]/files/[fileId] - Delete file
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ projectId: string; fileId: string }> }) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, fileId } = await params

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        project: {
          include: {
            access: true,
          },
        },
      },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const hasWriteAccess =
      file.project.ownerId === session.user?.id ||
      file.project.access.some((a) => a.userId === session.user?.id && (a.role === 'OWNER' || a.role === 'EDITOR'))

    if (!hasWriteAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete from filesystem
    const workspacePath = path.join(process.cwd(), 'workspaces', projectId)
    const fullFilePath = path.join(workspacePath, file.path)

    try {
      await fs.unlink(fullFilePath)
    } catch (error) {
      // File might not exist on disk, continue anyway
      console.warn('File not found on disk:', fullFilePath)
    }

    // Delete from R2 if stored there
    if (file.storageUrl) {
      const storageKey = `projects/${projectId}/${file.path}`
      await storage.deleteFile(storageKey)
    }

    await prisma.file.delete({
      where: { id: fileId },
    })

    return NextResponse.json({ message: 'File deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

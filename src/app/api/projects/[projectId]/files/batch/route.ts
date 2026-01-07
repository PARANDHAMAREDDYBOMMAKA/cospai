import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { storage } from '@/lib/storage'
import fs from 'fs/promises'
import path from 'path'

// POST /api/projects/[projectId]/files/batch - Create multiple files at once
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
    const { files } = body

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'Files array is required' }, { status: 400 })
    }

    const workspacePath = path.join(process.cwd(), 'workspaces', projectId)
    const createdFiles = []
    const errors = []

    // Process files in batches for better performance
    for (const fileData of files) {
      try {
        const { name, path: filePath, content, language } = fileData

        if (!name || !filePath) {
          errors.push({ path: filePath, error: 'Name and path are required' })
          continue
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
          // Skip existing files silently (they're already there)
          continue
        }

        const fileContent = content || ''
        const fileSize = Buffer.byteLength(fileContent, 'utf8')

        // Create file in workspace directory
        const fullFilePath = path.join(workspacePath, filePath)
        const fileDir = path.dirname(fullFilePath)

        // Ensure directory exists
        await fs.mkdir(fileDir, { recursive: true })

        // Write file to disk
        await fs.writeFile(fullFilePath, fileContent, 'utf8')

        // Auto-detect language from extension
        const fileName = name || filePath.split('/').pop() || 'untitled'
        const fileExt = fileName.split('.').pop()?.toLowerCase()

        const languageMap: Record<string, string> = {
          'js': 'javascript',
          'jsx': 'javascript',
          'ts': 'typescript',
          'tsx': 'typescript',
          'py': 'python',
          'html': 'html',
          'css': 'css',
          'json': 'json',
          'md': 'markdown',
          'txt': 'plaintext',
        }

        const detectedLanguage = language || languageMap[fileExt || ''] || 'plaintext'

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
            name: fileName,
            path: filePath,
            content: dbContent,
            size: fileSize,
            language: detectedLanguage,
            storageUrl,
            projectId: projectId,
          },
        })

        createdFiles.push(file)
      } catch (error: any) {
        errors.push({ path: fileData.path, error: error.message })
      }
    }

    return NextResponse.json(
      {
        success: true,
        created: createdFiles.length,
        errors: errors.length,
        files: createdFiles,
        errorDetails: errors,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[Batch Files API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

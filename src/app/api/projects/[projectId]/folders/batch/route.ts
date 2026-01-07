import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/projects/[projectId]/folders/batch - Create multiple folders at once
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
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

    const body = await request.json()
    const { folders } = body

    if (!Array.isArray(folders) || folders.length === 0) {
      return NextResponse.json({ error: 'Folders array is required' }, { status: 400 })
    }

    const createdFolders = []
    const errors = []

    // Sort folders by depth (create parent folders first)
    const sortedFolders = folders.sort((a, b) => {
      const depthA = (a.path.match(/\//g) || []).length
      const depthB = (b.path.match(/\//g) || []).length
      return depthA - depthB
    })

    for (const folderData of sortedFolders) {
      try {
        const { path } = folderData

        if (!path) {
          errors.push({ path, error: 'Path is required' })
          continue
        }

        const name = path.split('/').pop() || 'folder'

        // Check if folder already exists
        const existingFolder = await prisma.folder.findUnique({
          where: {
            projectId_path: {
              projectId: projectId,
              path: path,
            },
          },
        })

        if (existingFolder) {
          // Skip existing folders silently
          continue
        }

        // Find parent folder if exists
        const parentPath = path.substring(0, path.lastIndexOf('/'))
        let parentId = null

        if (parentPath) {
          const parentFolder = await prisma.folder.findUnique({
            where: {
              projectId_path: {
                projectId: projectId,
                path: parentPath,
              },
            },
          })

          if (parentFolder) {
            parentId = parentFolder.id
          }
        }

        const folder = await prisma.folder.create({
          data: {
            name,
            path,
            projectId,
            parentId,
          },
        })

        createdFolders.push(folder)
      } catch (error: any) {
        errors.push({ path: folderData.path, error: error.message })
      }
    }

    return NextResponse.json(
      {
        success: true,
        created: createdFolders.length,
        errors: errors.length,
        folders: createdFolders,
        errorDetails: errors,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[Batch Folders API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

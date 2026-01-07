import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
  throw new Error('Missing Cloudflare R2 credentials')
}

// Cloudflare R2 endpoint
const R2_ENDPOINT = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

export const storage = {
  /**
   * Upload a file to R2
   */
  async uploadFile(key: string, content: Buffer | string, contentType = 'text/plain'): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: content,
      ContentType: contentType,
    })

    await r2Client.send(command)
    return `${R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${key}`
  },

  /**
   * Get a file from R2
   */
  async getFile(key: string): Promise<string | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      })

      const response = await r2Client.send(command)
      const content = await response.Body?.transformToString()
      return content || null
    } catch (error) {
      console.error('Error getting file from R2:', error)
      return null
    }
  },

  /**
   * Delete a file from R2
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      })

      await r2Client.send(command)
      return true
    } catch (error) {
      console.error('Error deleting file from R2:', error)
      return false
    }
  },

  /**
   * Get a presigned URL for temporary access
   */
  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    })

    return await getSignedUrl(r2Client, command, { expiresIn })
  },

  /**
   * List files with a prefix
   */
  async listFiles(prefix?: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: prefix,
    })

    const response = await r2Client.send(command)
    return response.Contents?.map((item) => item.Key || '') || []
  },
}

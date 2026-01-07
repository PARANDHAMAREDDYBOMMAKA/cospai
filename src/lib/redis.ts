import { Redis } from '@upstash/redis'

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Missing Upstash Redis credentials')
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Helper functions for common operations
export const redisHelpers = {
  // Set with expiration (default 1 hour)
  async setWithExpiry(key: string, value: any, expirySeconds = 3600) {
    return await redis.setex(key, expirySeconds, JSON.stringify(value))
  },

  // Get and parse JSON
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await redis.get(key)
    if (!value) return null
    return typeof value === 'string' ? JSON.parse(value) as T : value as T
  },

  // Delete multiple keys
  async deleteMany(pattern: string) {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
    return keys.length
  },
}

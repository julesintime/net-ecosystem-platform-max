/**
 * Simple in-memory cache for ecosystem access data
 * TODO: Replace with Redis for production scalability
 */
class MemoryCache {
  private cache = new Map<string, { data: any; expiry: number }>()

  set(key: string, data: any, ttlSeconds: number = 300): void {
    const expiry = Date.now() + (ttlSeconds * 1000)
    this.cache.set(key, { data, expiry })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return item.data as T
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key)
      }
    }
  }
}

export const ecosystemCache = new MemoryCache()

// Clean up expired entries every 5 minutes
setInterval(() => {
  ecosystemCache.cleanup()
}, 5 * 60 * 1000)
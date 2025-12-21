// Simple rate limiter - stops spam attempts
class RateLimiter {
  constructor() {
    this.requests = new Map()
  }

  // Check if someone is making too many requests
  check(identifier, maxRequests = 5, windowMs = 15 * 60 * 1000) {
    const now = Date.now()
    const key = identifier
    
    // Get their request history
    if (!this.requests.has(key)) {
      this.requests.set(key, [])
    }
    
    const requestLog = this.requests.get(key)
    
    // Only count recent requests
    const recentRequests = requestLog.filter(time => now - time < windowMs)
    
    // Too many requests?
    if (recentRequests.length >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
      }
    }
    
    // Add this request
    recentRequests.push(now)
    this.requests.set(key, recentRequests)
    
    return {
      allowed: true,
      remaining: maxRequests - recentRequests.length,
      retryAfter: 0
    }
  }

  // Clean up old data
  cleanup() {
    const now = Date.now()
    const maxAge = 60 * 60 * 1000
    
    for (const [key, requests] of this.requests.entries()) {
      const recent = requests.filter(time => now - time < maxAge)
      if (recent.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, recent)
      }
    }
  }
}

// Create one instance
const rateLimiter = new RateLimiter()

// Clean up every 10 minutes
setInterval(() => rateLimiter.cleanup(), 10 * 60 * 1000)

export default rateLimiter
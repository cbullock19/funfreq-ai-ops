export class APIError extends Error {
  public timestamp: string

  constructor(
    message: string,
    public status: number,
    public service: string,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'APIError'
    this.timestamp = new Date().toISOString()
  }
}

export class RateLimitError extends APIError {
  constructor(service: string, public resetTime?: string) {
    super(`Rate limit exceeded for ${service}`, 429, service, true)
  }
}

export class ValidationError extends Error {
  constructor(message: string, public fields: string[] = []) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public code: string, public details?: unknown) {
    super(message)
    this.name = 'DatabaseError'
  }
} 
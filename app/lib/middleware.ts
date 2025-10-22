import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting middleware
export function rateLimit(requests: number = 100, windowMs: number = 15 * 60 * 1000) {
  return (request: NextRequest) => {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const key = `${ip}:${Math.floor(now / windowMs)}`;
    
    const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (now > current.resetTime) {
      current.count = 0;
      current.resetTime = now + windowMs;
    }
    
    current.count++;
    rateLimitStore.set(key, current);
    
    if (current.count > requests) {
      return NextResponse.json(
        { error: 'Too Many Requests', retryAfter: Math.ceil((current.resetTime - now) / 1000) },
        { status: 429, headers: { 'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString() } }
      );
    }
    
    return null;
  };
}

// Input validation middleware
export function validateInput<T>(schema: z.ZodSchema<T>) {
  return (request: NextRequest) => {
    try {
      const body = request.json();
      const validatedData = schema.parse(body);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: NextResponse.json(
            {
              error: 'Validation Error',
              details: error.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message
              }))
            },
            { status: 400 }
          )
        };
      }
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Invalid JSON' },
          { status: 400 }
        )
      };
    }
  };
}

// CORS middleware
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

// Security headers middleware
export function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  };
}

// Request logging middleware
export function logRequest(request: NextRequest) {
  const { method, url } = request;
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  console.log(`[${new Date().toISOString()}] ${method} ${url} - IP: ${ip} - UA: ${userAgent}`);
}

// Error handling wrapper
export function withErrorHandling(handler: (request: NextRequest) => Promise<Response>) {
  return async (request: NextRequest) => {
    try {
      logRequest(request);
      return await handler(request);
    } catch (error) {
      console.error('API Error:', error);
      
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { 
          status: 500,
          headers: {
            ...corsHeaders(),
            ...securityHeaders()
          }
        }
      );
    }
  };
}

// Combine all middleware
export function withMiddleware(
  handler: (request: NextRequest) => Promise<Response>,
  options: {
    rateLimit?: { requests: number; windowMs: number };
    validate?: z.ZodSchema<any>;
    requireAuth?: boolean;
  } = {}
) {
  return withErrorHandling(async (request: NextRequest) => {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: corsHeaders()
      });
    }
    
    // Apply rate limiting
    if (options.rateLimit) {
      const rateLimitResponse = rateLimit(options.rateLimit.requests, options.rateLimit.windowMs)(request);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
    }
    
    // Apply input validation
    if (options.validate && (request.method === 'POST' || request.method === 'PUT')) {
      const validation = validateInput(options.validate)(request);
      if (!validation.success) {
        return validation.error;
      }
    }
    
    // Apply authentication
    if (options.requireAuth) {
      const sessionId = request.cookies.get('session')?.value;
      if (!sessionId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { 
            status: 401,
            headers: corsHeaders()
          }
        );
      }
    }
    
    const response = await handler(request);
    
    // Add security headers to response
    Object.entries({
      ...corsHeaders(),
      ...securityHeaders()
    }).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  });
}

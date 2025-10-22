import { NextRequest } from "next/server";
import { prisma } from "./prisma";

// Simple session management (in production, use proper session store like Redis)
const sessions = new Map<string, { userId: string; expires: number }>();

export interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  isActive: boolean;
}

// Create session
export function createSession(userId: string): string {
  const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  
  sessions.set(sessionId, { userId, expires });
  return sessionId;
}

// Get session
export function getSession(sessionId: string): { userId: string; expires: number } | null {
  const session = sessions.get(sessionId);
  if (!session || session.expires < Date.now()) {
    sessions.delete(sessionId);
    return null;
  }
  return session;
}

// Destroy session
export function destroySession(sessionId: string): void {
  sessions.delete(sessionId);
}

// Get user from request
export async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  const sessionId = request.cookies.get('session')?.value;
  if (!sessionId) return null;
  
  const session = getSession(sessionId);
  if (!session) return null;
  
  // In production, fetch from database
  // For now, return a mock user
  return {
    id: session.userId,
    username: 'admin',
    role: 'ADMIN',
    isActive: true
  };
}

// Middleware for protected routes
export function requireAuth(handler: (request: NextRequest, user: User) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return handler(request, user);
  };
}

// Role-based access control
export function requireRole(allowedRoles: string[]) {
  return (handler: (request: NextRequest, user: User) => Promise<Response>) => {
    return async (request: NextRequest) => {
      const user = await getUserFromRequest(request);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (!allowedRoles.includes(user.role)) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return handler(request, user);
    };
  };
}

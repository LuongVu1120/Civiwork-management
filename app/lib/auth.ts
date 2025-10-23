import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

// Simple session management (in production, use proper session store like Redis)
const sessions = new Map<string, { userId: string; expires: number }>();

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  isActive: boolean;
  tokenVersion: number;
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
  
  if (!sessionId) {
    return null;
  }
  
  const session = getSession(sessionId);
  
  if (!session) {
    return null;
  }
  
  try {
    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      destroySession(sessionId);
      return null;
    }

    return user as User;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Authenticate user
export async function authenticateUser(username: string, password: string): Promise<User | null> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ],
        isActive: true
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        password: true,
        tokenVersion: true
      }
    });

    if (!user) return null;

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) return null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role as 'ADMIN' | 'MANAGER' | 'USER',
      isActive: user.isActive,
      tokenVersion: user.tokenVersion
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
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

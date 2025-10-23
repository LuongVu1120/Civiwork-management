import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'civiwork-super-secret-jwt-key-2024-change-in-production';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

// Generate access token
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Generate refresh token
export function generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

// Verify access token
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Verify refresh token
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as RefreshTokenPayload;
  } catch (error) {
    return null;
  }
}

// Generate token pair
export function generateTokenPair(user: {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  tokenVersion: number;
}) {
  const accessToken = generateAccessToken({
    userId: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    tokenVersion: user.tokenVersion
  });

  return { accessToken, refreshToken };
}

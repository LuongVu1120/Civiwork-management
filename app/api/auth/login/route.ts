import { NextRequest, NextResponse } from "next/server";
import { withMiddleware } from "@/app/lib/middleware";
import { authenticateUser } from "@/app/lib/auth";
import { generateTokenPair } from "@/app/lib/jwt";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";

const LoginSchema = z.object({
  username: z.string().min(1, 'Username là bắt buộc'),
  password: z.string().min(1, 'Password là bắt buộc')
});

async function login(request: NextRequest, validatedData: any) {
  const { username, password } = validatedData;
  
  try {
    // Authenticate user
    const user = await authenticateUser(username, password);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Tên đăng nhập hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokenPair({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tokenVersion: user.tokenVersion || 0
    });
    
    const response = NextResponse.json({ 
      success: true, 
      message: 'Đăng nhập thành công',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      redirectTo: '/'
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi đăng nhập' },
      { status: 500 }
    );
  }
}

export const POST = withMiddleware(login, {
  rateLimit: { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  validate: LoginSchema,
  requireAuth: false
});

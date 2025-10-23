import { NextRequest, NextResponse } from "next/server";
import { withMiddleware } from "@/app/lib/middleware";
import { verifyRefreshToken, generateTokenPair } from "@/app/lib/jwt";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";

const RefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token là bắt buộc')
});

async function refresh(request: NextRequest, validatedData: any) {
  const { refreshToken } = validatedData;
  
  try {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Refresh token không hợp lệ' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        tokenVersion: true
      }
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Người dùng không tồn tại hoặc đã bị vô hiệu hóa' },
        { status: 401 }
      );
    }

    // Check if token version matches (for security)
    if (user.tokenVersion !== payload.tokenVersion) {
      return NextResponse.json(
        { error: 'Token đã bị vô hiệu hóa' },
        { status: 401 }
      );
    }

    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tokenVersion: user.tokenVersion
    });

    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi làm mới token' },
      { status: 500 }
    );
  }
}

export const POST = withMiddleware(refresh, {
  rateLimit: { requests: 10, windowMs: 15 * 60 * 1000 },
  validate: RefreshSchema,
  requireAuth: false
});

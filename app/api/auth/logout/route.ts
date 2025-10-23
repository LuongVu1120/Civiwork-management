import { NextRequest, NextResponse } from "next/server";
import { withMiddleware } from "@/app/lib/middleware";
import { verifyRefreshToken } from "@/app/lib/jwt";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";

const LogoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token là bắt buộc')
});

async function logout(request: NextRequest, validatedData: any) {
  const { refreshToken } = validatedData;
  
  try {
    // Verify refresh token to get user ID
    const payload = verifyRefreshToken(refreshToken);
    
    if (payload) {
      // Increment token version to invalidate all existing tokens
      await prisma.user.update({
        where: { id: payload.userId },
        data: { 
          tokenVersion: {
            increment: 1
          }
        }
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Đăng xuất thành công' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi đăng xuất' },
      { status: 500 }
    );
  }
}

export const POST = withMiddleware(logout, {
  rateLimit: { requests: 10, windowMs: 15 * 60 * 1000 },
  validate: LogoutSchema,
  requireAuth: false
});

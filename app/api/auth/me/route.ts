import { NextRequest, NextResponse } from "next/server";
import { withMiddleware } from "@/app/lib/middleware";
import { verifyAccessToken } from "@/app/lib/jwt";
import { prisma } from "@/app/lib/prisma";

async function getCurrentUser(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token không được cung cấp' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyAccessToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Token không hợp lệ' },
        { status: 401 }
      );
    }

    // Get user from database to ensure they still exist and are active
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

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy thông tin người dùng' },
      { status: 500 }
    );
  }
}

export const GET = withMiddleware(getCurrentUser, {
  rateLimit: { requests: 100, windowMs: 15 * 60 * 1000 },
  requireAuth: false // Không cần requireAuth vì đã check trong handler
});

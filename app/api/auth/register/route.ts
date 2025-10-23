import { NextRequest, NextResponse } from "next/server";
import { withMiddleware } from "@/app/lib/middleware";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const RegisterSchema = z.object({
  username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự').max(50, 'Tên đăng nhập không được quá 50 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  fullName: z.string().min(1, 'Họ tên là bắt buộc').max(100, 'Họ tên không được quá 100 ký tự')
});

async function register(request: NextRequest, validatedData: any) {
  const { username, email, password, fullName } = validatedData;
  
  try {
    // Kiểm tra username đã tồn tại
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return NextResponse.json(
          { error: 'Tên đăng nhập đã được sử dụng' },
          { status: 400 }
        );
      }
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: 'Email đã được sử dụng' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Tạo user mới
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        fullName,
        role: 'USER', // Mặc định là USER
        isActive: true
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Đăng ký thành công',
      user: newUser
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi đăng ký' },
      { status: 500 }
    );
  }
}

export const POST = withMiddleware(register, {
  rateLimit: { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  validate: RegisterSchema,
  requireAuth: false
});

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withMiddleware } from "@/app/lib/middleware";

async function getReceipts(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));
  const projectId = searchParams.get('projectId') || undefined;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const where: any = {};
  if (projectId) where.projectId = projectId;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const [total, list] = await Promise.all([
    prisma.receipt.count({ where }),
    prisma.receipt.findMany({ where, orderBy: { date: 'desc' }, skip: (page-1)*limit, take: limit })
  ]);
  return NextResponse.json({ items: list, page, limit, total });
}

export const GET = withMiddleware(getReceipts, {
  rateLimit: { requests: 100, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});

async function createReceipt(request: NextRequest) {
  try {
    const body = await request.json();
    const created = await prisma.receipt.create({ data: body });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating receipt:', error);
    return NextResponse.json(
      { error: "Không thể tạo bản ghi thu tiền" }, 
      { status: 500 }
    );
  }
}

export const POST = withMiddleware(createReceipt, {
  rateLimit: { requests: 20, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});

async function updateReceipt(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: "ID bản ghi thu tiền là bắt buộc" }, 
        { status: 400 }
      );
    }

    const updated = await prisma.receipt.update({
      where: { id },
      data: updateData
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating receipt:', error);
    return NextResponse.json(
      { error: "Không thể cập nhật bản ghi thu tiền" }, 
      { status: 500 }
    );
  }
}

export const PUT = withMiddleware(updateReceipt, {
  rateLimit: { requests: 20, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});

async function deleteReceipt(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "ID bản ghi thu tiền là bắt buộc" }, 
        { status: 400 }
      );
    }

    await prisma.receipt.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    return NextResponse.json(
      { error: "Không thể xóa bản ghi thu tiền" }, 
      { status: 500 }
    );
  }
}

export const DELETE = withMiddleware(deleteReceipt, {
  rateLimit: { requests: 20, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});



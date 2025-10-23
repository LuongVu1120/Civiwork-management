import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withMiddleware } from "@/app/lib/middleware";

async function getReceipts(request: NextRequest) {
  const list = await prisma.receipt.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(list);
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



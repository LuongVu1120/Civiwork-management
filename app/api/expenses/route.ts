import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withMiddleware } from "@/app/lib/middleware";

async function getExpenses(request: NextRequest) {
  const list = await prisma.expense.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(list);
}

export const GET = withMiddleware(getExpenses, {
  rateLimit: { requests: 100, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});

async function createExpense(request: NextRequest) {
  try {
    const body = await request.json();
    const created = await prisma.expense.create({ data: body });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: "Không thể tạo chi phí" }, 
      { status: 500 }
    );
  }
}

export const POST = withMiddleware(createExpense, {
  rateLimit: { requests: 20, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});

async function updateExpense(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: "ID chi phí là bắt buộc" }, 
        { status: 400 }
      );
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: updateData
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: "Không thể cập nhật chi phí" }, 
      { status: 500 }
    );
  }
}

export const PUT = withMiddleware(updateExpense, {
  rateLimit: { requests: 20, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});

async function deleteExpense(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "ID chi phí là bắt buộc" }, 
        { status: 400 }
      );
    }

    await prisma.expense.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: "Không thể xóa chi phí" }, 
      { status: 500 }
    );
  }
}

export const DELETE = withMiddleware(deleteExpense, {
  rateLimit: { requests: 20, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});



import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const list = await prisma.receipt.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(list);
}

export async function POST(request: Request) {
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

export async function PUT(request: Request) {
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

export async function DELETE(request: Request) {
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



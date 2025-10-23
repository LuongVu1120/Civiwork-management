import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withMiddleware } from "@/app/lib/middleware";

async function getMaterials(request: NextRequest) {
  const list = await prisma.materialPurchase.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(list);
}

export const GET = withMiddleware(getMaterials, {
  rateLimit: { requests: 100, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});

async function createMaterial(request: NextRequest) {
  try {
    const body = await request.json();
    const created = await prisma.materialPurchase.create({ data: body });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating material:', error);
    return NextResponse.json(
      { error: "Không thể tạo bản ghi vật tư" }, 
      { status: 500 }
    );
  }
}

export const POST = withMiddleware(createMaterial, {
  rateLimit: { requests: 20, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});



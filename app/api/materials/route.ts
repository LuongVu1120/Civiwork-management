import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withMiddleware } from "@/app/lib/middleware";

async function getMaterials(request: NextRequest) {
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
    prisma.materialPurchase.count({ where }),
    prisma.materialPurchase.findMany({ where, orderBy: { date: 'desc' }, skip: (page-1)*limit, take: limit })
  ]);
  return NextResponse.json({ items: list, page, limit, total });
}

export const GET = withMiddleware(getMaterials, {
  rateLimit: { requests: 100, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});

async function createMaterial(request: NextRequest) {
  try {
    const body = await request.json();
    // Normalize expected fields for new schema
    const data: any = {
      projectId: body.projectId,
      date: new Date(body.date),
      itemName: body.itemName,
      unit: body.unit ?? null,
      quantityText: body.quantityText ?? String(body.quantity ?? ''),
      // keep numeric quantity if provided for legacy compatibility
      quantity: typeof body.quantity === 'number' ? body.quantity : null,
      unitPriceVnd: Number(body.unitPriceVnd) || 0,
      totalVnd: Number(body.totalVnd) || Number(body.unitPriceVnd) || 0,
      supplier: body.supplier ?? null
    };
    const created = await prisma.materialPurchase.create({ data });
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



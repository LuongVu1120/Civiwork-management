import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withMiddleware } from "@/app/lib/middleware";
import { CreateExternalHireSchema, UpdateExternalHireSchema } from "@/app/lib/schemas";

async function getExternalHires(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));
  const projectId = searchParams.get('projectId') || undefined;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const where: any = { isActive: true };
  if (projectId) where.projectId = projectId;
  if (startDate || endDate) {
    where.startDate = {} as any;
    if (startDate) where.startDate.gte = new Date(startDate);
    if (endDate) where.startDate.lte = new Date(endDate);
  }

  const [total, items] = await Promise.all([
    prisma.externalHire.count({ where }),
    prisma.externalHire.findMany({ where, orderBy: { startDate: 'desc' }, skip: (page-1)*limit, take: limit, include: { project: true } })
  ]);
  return NextResponse.json({ items, page, limit, total });
}

async function createExternalHire(_req: NextRequest, data: any) {
  const created = await prisma.externalHire.create({
    data: {
      projectId: data.projectId,
      title: data.title,
      description: data.description ?? null,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      amountVnd: data.amountVnd
    }
  });
  return NextResponse.json(created, { status: 201 });
}

async function updateExternalHire(_req: NextRequest, data: any) {
  const { id, ...rest } = data;
  const updated = await prisma.externalHire.update({
    where: { id },
    data: {
      ...(rest.projectId !== undefined ? { projectId: rest.projectId } : {}),
      ...(rest.title !== undefined ? { title: rest.title } : {}),
      ...(rest.description !== undefined ? { description: rest.description ?? null } : {}),
      ...(rest.startDate !== undefined ? { startDate: new Date(rest.startDate) } : {}),
      ...(rest.endDate !== undefined ? { endDate: new Date(rest.endDate) } : {}),
      ...(rest.amountVnd !== undefined ? { amountVnd: rest.amountVnd } : {}),
    }
  });
  return NextResponse.json(updated);
}

async function deleteExternalHire(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await prisma.externalHire.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}

export const GET = withMiddleware(getExternalHires, { requireAuth: true, rateLimit: { requests: 100, windowMs: 15*60*1000 } });
export const POST = withMiddleware(createExternalHire, { requireAuth: true, validate: CreateExternalHireSchema, rateLimit: { requests: 20, windowMs: 15*60*1000 } });
export const PUT = withMiddleware(updateExternalHire, { requireAuth: true, validate: UpdateExternalHireSchema, rateLimit: { requests: 30, windowMs: 15*60*1000 } });
export const DELETE = withMiddleware(deleteExternalHire, { requireAuth: true, rateLimit: { requests: 20, windowMs: 15*60*1000 } });



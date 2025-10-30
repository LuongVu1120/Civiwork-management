import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withMiddleware } from "@/app/lib/middleware";
import { CreateWorkerSchema, UpdateWorkerSchema } from "@/app/lib/schemas";
import { z } from "zod";

async function getWorkers(request: NextRequest) {
  const workers = await prisma.worker.findMany({ 
    orderBy: { fullName: "asc" },
    where: { isActive: true }
  });
  return NextResponse.json(workers);
}

async function createWorker(request: NextRequest, validatedData: any) {
  const created = await prisma.worker.create({
    data: {
      fullName: validatedData.fullName,
      role: validatedData.role,
      dailyRateVnd: validatedData.dailyRateVnd,
      monthlyAllowanceVnd: validatedData.monthlyAllowanceVnd,
    },
  });
  
  return NextResponse.json(created, { status: 201 });
}

export const GET = withMiddleware(getWorkers, {
  rateLimit: { requests: 100, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});

export const POST = withMiddleware(createWorker, {
  rateLimit: { requests: 20, windowMs: 15 * 60 * 1000 },
  validate: CreateWorkerSchema,
  requireAuth: true // Tạm thời disable auth cho development
});

// Update worker
const UpdateWorkerWithId = UpdateWorkerSchema.extend({ id: z.string().cuid("ID không hợp lệ") });

async function updateWorker(request: NextRequest, validatedData: any) {
  const updated = await prisma.worker.update({
    where: { id: validatedData.id },
    data: {
      ...(validatedData.fullName !== undefined ? { fullName: validatedData.fullName } : {}),
      ...(validatedData.role !== undefined ? { role: validatedData.role } : {}),
      ...(validatedData.dailyRateVnd !== undefined ? { dailyRateVnd: validatedData.dailyRateVnd } : {}),
      ...(validatedData.monthlyAllowanceVnd !== undefined ? { monthlyAllowanceVnd: validatedData.monthlyAllowanceVnd } : {}),
    }
  });
  return NextResponse.json(updated);
}

export const PUT = withMiddleware(updateWorker, {
  rateLimit: { requests: 30, windowMs: 15 * 60 * 1000 },
  validate: UpdateWorkerWithId,
  requireAuth: true
});

// Soft delete worker (set isActive=false)
async function deleteWorker(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.worker.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}

export const DELETE = withMiddleware(deleteWorker, {
  rateLimit: { requests: 20, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});



import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withMiddleware } from "@/app/lib/middleware";
import { CreateWorkerSchema } from "@/app/lib/schemas";
import { requireAuth } from "@/app/lib/auth";

async function getWorkers(request: NextRequest) {
  const workers = await prisma.worker.findMany({ 
    orderBy: { fullName: "asc" },
    where: { isActive: true }
  });
  return NextResponse.json(workers);
}

async function createWorker(request: NextRequest) {
  const body = await request.json();
  const validatedData = CreateWorkerSchema.parse(body);
  
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
  rateLimit: { requests: 100, windowMs: 15 * 60 * 1000 }
});

export const POST = withMiddleware(createWorker, {
  rateLimit: { requests: 20, windowMs: 15 * 60 * 1000 },
  validate: CreateWorkerSchema,
  requireAuth: true
});



import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withMiddleware } from "@/app/lib/middleware";
import { CreateAttendanceSchema } from "@/app/lib/schemas";

async function getAttendances(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));
  const projectId = searchParams.get('projectId') || undefined;
  const workerId = searchParams.get('workerId') || undefined;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const where: any = {};
  if (projectId) where.projectId = projectId;
  if (workerId) where.workerId = workerId;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const [total, attendances] = await Promise.all([
    prisma.attendance.count({ where }),
    prisma.attendance.findMany({ 
      where,
      orderBy: { date: 'desc' },
      skip: (page-1)*limit,
      take: limit,
      include: {
        worker: { select: { id: true, fullName: true } },
        project: { select: { id: true, name: true } }
      }
    })
  ]);
  return NextResponse.json({ items: attendances, page, limit, total });
}

async function createAttendance(request: NextRequest, validatedData: any) {
  const created = await prisma.attendance.create({
    data: {
      date: new Date(validatedData.date),
      projectId: validatedData.projectId,
      workerId: validatedData.workerId,
      dayFraction: validatedData.dayFraction,
      meal: validatedData.meal,
      notes: validatedData.notes
    },
    include: {
      worker: {
        select: { id: true, fullName: true }
      },
      project: {
        select: { id: true, name: true }
      }
    }
  });
  
  return NextResponse.json(created, { status: 201 });
}

async function updateAttendance(request: NextRequest, validatedData: any) {
  const { id, ...updateData } = validatedData;
  
  if (!id) {
    return NextResponse.json(
      { error: "ID bản ghi chấm công là bắt buộc" }, 
      { status: 400 }
    );
  }

  const updated = await prisma.attendance.update({
    where: { id },
    data: {
      date: new Date(updateData.date),
      projectId: updateData.projectId,
      workerId: updateData.workerId,
      dayFraction: updateData.dayFraction,
      meal: updateData.meal,
      notes: updateData.notes
    },
    include: {
      worker: {
        select: { id: true, fullName: true }
      },
      project: {
        select: { id: true, name: true }
      }
    }
  });
  
  return NextResponse.json(updated);
}

async function deleteAttendance(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json(
      { error: "ID bản ghi chấm công là bắt buộc" }, 
      { status: 400 }
    );
  }

  await prisma.attendance.delete({
    where: { id }
  });
  
  return NextResponse.json({ success: true });
}

export const GET = withMiddleware(getAttendances, {
  rateLimit: { requests: 100, windowMs: 60 * 1000 },
  requireAuth: true
});

export const POST = withMiddleware(createAttendance, {
  rateLimit: { requests: 100, windowMs: 60 * 1000 },
  validate: CreateAttendanceSchema,
  requireAuth: true // Tạm thời disable auth cho development
});

export const PUT = withMiddleware(updateAttendance, {
  rateLimit: { requests: 100, windowMs: 60 * 1000 },
  requireAuth: true // Tạm thời disable auth cho development
});

export const DELETE = withMiddleware(deleteAttendance, {
  // Nâng giới hạn để thao tác xóa không bị 429 trong lúc dev/FE
  rateLimit: { requests: 100, windowMs: 60 * 1000 },
  requireAuth: true // Tạm thời disable auth cho development
});



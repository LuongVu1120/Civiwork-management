import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withMiddleware } from "@/app/lib/middleware";
import { CreateAttendanceSchema } from "@/app/lib/schemas";

async function getAttendances(request: NextRequest) {
  const attendances = await prisma.attendance.findMany({ 
    orderBy: { date: "desc" },
    include: {
      worker: {
        select: { id: true, fullName: true }
      },
      project: {
        select: { id: true, name: true }
      }
    }
  });
  return NextResponse.json(attendances);
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
  rateLimit: { requests: 100, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});

export const POST = withMiddleware(createAttendance, {
  rateLimit: { requests: 20, windowMs: 15 * 60 * 1000 },
  validate: CreateAttendanceSchema,
  requireAuth: true // Tạm thời disable auth cho development
});

export const PUT = withMiddleware(updateAttendance, {
  rateLimit: { requests: 20, windowMs: 15 * 60 * 1000 },
  requireAuth: true // Tạm thời disable auth cho development
});

export const DELETE = withMiddleware(deleteAttendance, {
  rateLimit: { requests: 20, windowMs: 15 * 60 * 1000 },
  requireAuth: true // Tạm thời disable auth cho development
});



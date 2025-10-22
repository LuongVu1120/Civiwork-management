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

async function createAttendance(request: NextRequest) {
  const body = await request.json();
  const validatedData = CreateAttendanceSchema.parse(body);
  
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

export const GET = withMiddleware(getAttendances, {
  rateLimit: { requests: 100, windowMs: 15 * 60 * 1000 }
});

export const POST = withMiddleware(createAttendance, {
  rateLimit: { requests: 20, windowMs: 15 * 60 * 1000 },
  validate: CreateAttendanceSchema,
  requireAuth: true
});



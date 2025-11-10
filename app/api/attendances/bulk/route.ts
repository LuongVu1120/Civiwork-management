import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withMiddleware } from "@/app/lib/middleware";
import { CreateAttendanceBulkSchema } from "@/app/lib/schemas";

async function createAttendancesBulk(request: NextRequest, validatedData: any) {
  const { date, projectId, workerIds, dayFraction, meal, notes } = validatedData;

  // Optional: prevent duplicate records for same (date, projectId, workerId)
  // We'll insert only for workers who don't already have a record that day for the same project
  const dateStart = new Date(date);
  const dateEnd = new Date(date);
  dateEnd.setUTCHours(23, 59, 59, 999);

  const existing = await prisma.attendance.findMany({
    where: {
      projectId,
      workerId: { in: workerIds },
      date: { gte: dateStart, lte: dateEnd }
    },
    select: { workerId: true }
  });
  const existingWorkerIds = new Set(existing.map(e => e.workerId));
  const toInsert = workerIds.filter((id: any) => !existingWorkerIds.has(id));

  if (toInsert.length === 0) {
    return NextResponse.json({ inserted: 0, skipped: workerIds.length }, { status: 200 });
  }

  const inserted = await prisma.attendance.createMany({
    data: toInsert.map((workerId: any) => ({
      date: new Date(date),
      projectId,
      workerId,
      dayFraction,
      meal,
      notes
    })),
    skipDuplicates: true
  });

  return NextResponse.json({ inserted: inserted.count, skipped: workerIds.length - inserted.count }, { status: 201 });
}

export const POST = withMiddleware(createAttendancesBulk, {
  // Nới giới hạn để thao tác dev/FE không dính 429 quá sớm
  rateLimit: { requests: 100, windowMs: 60 * 1000 },
  validate: CreateAttendanceBulkSchema,
  requireAuth: true
});



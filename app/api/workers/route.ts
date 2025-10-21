import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const workers = await prisma.worker.findMany({ orderBy: { fullName: "asc" } });
  return NextResponse.json(workers);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { fullName, role, dailyRateVnd, monthlyAllowanceVnd } = body;
  const created = await prisma.worker.create({
    data: {
      fullName,
      role,
      dailyRateVnd,
      monthlyAllowanceVnd: monthlyAllowanceVnd ?? 0,
    },
  });
  return NextResponse.json(created, { status: 201 });
}



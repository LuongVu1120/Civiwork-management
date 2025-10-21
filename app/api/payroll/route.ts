import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { calculateMonthlyPayroll } from "@/app/services/payroll";

// GET /api/payroll?workerId=...&year=2025&month=10
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workerId = searchParams.get("workerId");
  const year = parseInt(searchParams.get("year") || "");
  const month = parseInt(searchParams.get("month") || "");
  if (!workerId || !year || !month) {
    return NextResponse.json({ error: "workerId, year, month là bắt buộc" }, { status: 400 });
  }

  const result = await calculateMonthlyPayroll(prisma, workerId, year, month);
  return NextResponse.json(result);
}



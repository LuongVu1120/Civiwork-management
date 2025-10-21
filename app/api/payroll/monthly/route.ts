import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { calculateMonthlyPayroll } from "@/app/services/payroll";

// GET /api/payroll/monthly?year=2025&month=10
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") || "");
  const month = parseInt(searchParams.get("month") || "");
  if (!year || !month) {
    return NextResponse.json({ error: "year, month là bắt buộc" }, { status: 400 });
  }

  const workers = await prisma.worker.findMany({ where: { isActive: true } });

  const results = await Promise.all(
    workers.map(w => calculateMonthlyPayroll(prisma, w.id, year, month).then(r => ({ ...r, fullName: w.fullName })))
  );

  const totalPayable = results.reduce((s, r) => s + r.payableVnd, 0);
  return NextResponse.json({ year, month, totalPayableVnd: totalPayable, items: results });
}



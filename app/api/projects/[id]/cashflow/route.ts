import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// GET /api/projects/:id/cashflow?year=2025&month=10 (month optional)
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;

  const url = new URL(_request.url);
  const yearParam = url.searchParams.get("year");
  const monthParam = url.searchParams.get("month");

  let dateFilter: { gte?: Date; lt?: Date } | undefined;
  if (yearParam && monthParam) {
    const year = parseInt(yearParam);
    const month = parseInt(monthParam);
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
    dateFilter = { gte: start, lt: end };
  }

  const [receipts, expenses, materials, attendances] = await Promise.all([
    prisma.receipt.findMany({ where: { projectId, ...(dateFilter ? { date: dateFilter } : {}) } }),
    prisma.expense.findMany({ where: { projectId, ...(dateFilter ? { date: dateFilter } : {}) } }),
    prisma.materialPurchase.findMany({ where: { projectId, ...(dateFilter ? { date: dateFilter } : {}) } }),
    prisma.attendance.findMany({ where: { projectId, ...(dateFilter ? { date: dateFilter } : {}) }, include: { worker: true } }),
  ]);

  const totalReceipts = receipts.reduce((s: number, r: { amountVnd: number }) => s + r.amountVnd, 0);
  const totalExpenses = expenses.reduce((s: number, e: { amountVnd: number }) => s + e.amountVnd, 0);
  const totalMaterials = materials.reduce((s: number, m: { totalVnd: number }) => s + m.totalVnd, 0);

  // Ước tính lương theo attendance (không tính phụ cấp tháng ở đây)
  const wageFromAttendance = attendances.reduce(
    (s: number, a: { dayFraction: any; worker: { dailyRateVnd: number } }) =>
      s + Math.round(Number(a.dayFraction) * a.worker.dailyRateVnd),
    0
  );

  const cashOut = totalExpenses + totalMaterials; // chi ghi nhận trực tiếp
  const cashIn = totalReceipts;
  const grossProfitEst = cashIn - (cashOut + wageFromAttendance); // ước tính lợi nhuận gộp

  return NextResponse.json({
    projectId,
    period: yearParam && monthParam ? { year: Number(yearParam), month: Number(monthParam) } : null,
    totals: {
      receipts: totalReceipts,
      expenses: totalExpenses,
      materials: totalMaterials,
      wageEstimated: wageFromAttendance,
      cashIn,
      cashOut,
      grossProfitEstimated: grossProfitEst,
    },
    details: { receipts, expenses, materials },
  });
}


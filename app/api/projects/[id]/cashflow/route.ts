import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withDynamicMiddleware } from "@/app/lib/middleware";

// GET /api/projects/:id/cashflow?year=2025&month=10 (month optional)
async function getProjectCashflow(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const url = new URL(_request.url);
    const yearParam = url.searchParams.get("year");
    const monthParam = url.searchParams.get("month");

    let dateFilter: { gte?: Date; lt?: Date } | undefined;
    if (yearParam && monthParam) {
      const year = parseInt(yearParam);
      const month = parseInt(monthParam);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return NextResponse.json({ error: "Invalid year or month" }, { status: 400 });
      }
      
      const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
      dateFilter = { gte: start, lt: end };
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let receipts, expenses, materials, attendances;
    
    try {
      receipts = await prisma.receipt.findMany({ where: { projectId, ...(dateFilter ? { date: dateFilter } : {}) } });
      expenses = await prisma.expense.findMany({ where: { projectId, ...(dateFilter ? { date: dateFilter } : {}) } });
      materials = await prisma.materialPurchase.findMany({ where: { projectId, ...(dateFilter ? { date: dateFilter } : {}) } });
      attendances = await prisma.attendance.findMany({ where: { projectId, ...(dateFilter ? { date: dateFilter } : {}) }, include: { worker: true } });
      
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json(
        { 
          error: "Lỗi truy vấn database. Vui lòng kiểm tra dữ liệu và thử lại.",
          details: dbError instanceof Error ? dbError.message : "Unknown database error"
        }, 
        { status: 503 }
      );
    }

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
  } catch (error) {
    console.error('Error in project cashflow API:', error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi lấy dữ liệu dòng tiền" }, 
      { status: 500 }
    );
  }
}

export const GET = withDynamicMiddleware(getProjectCashflow, {
  rateLimit: { requests: 100, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});


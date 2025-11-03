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

    // Check if project exists first
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let dateFilter: { gte?: Date; lt?: Date } | undefined;
    let periodInfo: { type: "month" | "all"; startDate?: string; endDate?: string } | null = null;
    
    if (yearParam && monthParam) {
      // Filter by specific month
      const year = parseInt(yearParam);
      const month = parseInt(monthParam);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return NextResponse.json({ error: "Invalid year or month" }, { status: 400 });
      }
      
      const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      dateFilter = { gte: start, lt: end };
      periodInfo = { type: "month", startDate: start.toISOString(), endDate: end.toISOString() };
    } else {
      // Show all data from project start to end/updatedAt
      const startDate = project.startDate || project.createdAt;
      const endDate = project.endDate || project.updatedAt || new Date();
      // Add 1 day to endDate to include the entire end date
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      
      dateFilter = { gte: startDate, lt: endDatePlusOne };
      periodInfo = { 
        type: "all",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
    }

    let receipts, materials, attendances, externalHires;
    
    try {
      const whereClause = { projectId, ...(dateFilter ? { date: dateFilter } : {}) };
      
      receipts = await prisma.receipt.findMany({ where: whereClause });
      materials = await prisma.materialPurchase.findMany({ where: whereClause });
      attendances = await prisma.attendance.findMany({ where: whereClause, include: { worker: true } });
      
      // Query external hires - filter by projectId and isActive
      const externalHiresWhere: any = { 
        projectId, 
        isActive: true 
      };
      
      // If date filter exists, filter external hires that overlap with the period
      // An external hire overlaps if: startDate <= periodEnd && endDate >= periodStart
      if (dateFilter && dateFilter.gte && dateFilter.lt) {
        externalHiresWhere.AND = [
          { projectId },
          { isActive: true },
          { startDate: { lte: dateFilter.lt } }, // starts before or at period end
          { endDate: { gte: dateFilter.gte } }   // ends after or at period start
        ];
      }
      
      externalHires = await prisma.externalHire.findMany({ where: externalHiresWhere });
      
      // Debug logging
      console.log('Cashflow query:', {
        projectId,
        dateFilter: dateFilter ? {
          gte: dateFilter.gte?.toISOString(),
          lt: dateFilter.lt?.toISOString()
        } : null,
        counts: {
          receipts: receipts.length,
          materials: materials.length,
          attendances: attendances.length,
          externalHires: externalHires.length
        }
      });
      
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
    const totalMaterials = materials.reduce((s: number, m: { totalVnd: number }) => s + m.totalVnd, 0);
    const totalExternalHires = externalHires.reduce((s: number, eh: { amountVnd: number }) => s + eh.amountVnd, 0);

    // Ước tính lương theo attendance (không tính phụ cấp tháng ở đây)
    const wageFromAttendance = attendances.reduce(
      (s: number, a: { dayFraction: any; worker: { dailyRateVnd: number } }) =>
        s + Math.round(Number(a.dayFraction) * a.worker.dailyRateVnd),
      0
    );

    // Expenses đã được bỏ, tính materials và thuê ngoài vào cashOut
    const cashOut = totalMaterials + totalExternalHires; // chi tính vật tư + thuê ngoài (đã bỏ expenses)
    const cashIn = totalReceipts;
    const grossProfitEst = cashIn - (cashOut + wageFromAttendance); // ước tính lợi nhuận gộp

    return NextResponse.json({
      projectId,
      project: {
        name: project.name,
        startDate: project.startDate?.toISOString() || null,
        endDate: project.endDate?.toISOString() || null,
        isCompleted: project.isCompleted,
        updatedAt: project.updatedAt.toISOString(),
      },
      period: periodInfo,
      totals: {
        receipts: totalReceipts,
        materials: totalMaterials,
        externalHires: totalExternalHires,
        wageEstimated: wageFromAttendance,
        cashIn,
        cashOut,
        grossProfitEstimated: grossProfitEst,
      },
      details: { 
        receipts, 
        materials,
        externalHires: externalHires.map(eh => ({
          id: eh.id,
          title: eh.title,
          description: eh.description,
          startDate: eh.startDate.toISOString(),
          endDate: eh.endDate.toISOString(),
          amountVnd: eh.amountVnd
        }))
      },
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


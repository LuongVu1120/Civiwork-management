import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { calculateMonthlyPayroll } from "@/app/services/payroll";
import { withMiddleware } from "@/app/lib/middleware";

// GET /api/payroll/monthly?year=2025&month=10
async function getMonthlyPayroll(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || "");
    const month = parseInt(searchParams.get("month") || "");
    
    if (!year || !month) {
      return NextResponse.json({ error: "year, month là bắt buộc" }, { status: 400 });
    }

    if (month < 1 || month > 12) {
      return NextResponse.json({ error: "Tháng phải từ 1-12" }, { status: 400 });
    }

    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // Bao gồm cả nhân sự đã xóa mềm nếu có dữ liệu trong tháng
    const workers = await prisma.worker.findMany({
      where: {
        OR: [
          { isActive: true },
          { attendances: { some: { date: { gte: monthStart, lte: monthEnd } } } },
          { payrolls: { some: { year, month } } }
        ]
      },
      orderBy: { fullName: 'asc' }
    });

    if (workers.length === 0) {
      return NextResponse.json({ 
        year, 
        month, 
        totalPayableVnd: 0, 
        items: [] 
      });
    }

    const results = await Promise.all(
      workers.map(async w => {
        try {
          const result = await calculateMonthlyPayroll(prisma, w.id, year, month);
          return { ...result, fullName: w.fullName };
        } catch (error) {
          console.error(`Error calculating payroll for worker ${w.id}:`, error);
          return {
            workerId: w.id,
            fullName: w.fullName,
            year,
            month,
            totalDays: 0,
            wageTotalVnd: 0,
            mealTotalVnd: 0,
            allowanceVnd: 0,
            adjustmentsVnd: 0,
            payableVnd: 0,
          };
        }
      })
    );

    const totalPayable = results.reduce((s, r) => s + r.payableVnd, 0);
    
    return NextResponse.json({ 
      year, 
      month, 
      totalPayableVnd: totalPayable, 
      items: results 
    });
  } catch (error) {
    console.error('Error in payroll monthly API:', error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi tính toán bảng công" }, 
      { status: 500 }
    );
  }
}

export const GET = withMiddleware(getMonthlyPayroll, {
  rateLimit: { requests: 100, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});



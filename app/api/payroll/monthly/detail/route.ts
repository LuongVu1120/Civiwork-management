import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withMiddleware } from "@/app/lib/middleware";

// GET /api/payroll/monthly/detail?year=2025&month=10&workerId=xxx
async function getPayrollDetail(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || "");
    const month = parseInt(searchParams.get("month") || "");
    const workerId = searchParams.get("workerId");
    
    if (!year || !month) {
      return NextResponse.json({ error: "year, month là bắt buộc" }, { status: 400 });
    }

    if (month < 1 || month > 12) {
      return NextResponse.json({ error: "Tháng phải từ 1-12" }, { status: 400 });
    }

    // Calculate date range
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));

    let whereClause: any = {
      date: { gte: start, lt: end },
    };

    if (workerId) {
      whereClause.workerId = workerId;
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        worker: {
          select: { fullName: true, role: true }
        },
        project: {
          select: { name: true }
        }
      },
      orderBy: [
        { worker: { fullName: 'asc' } },
        { date: 'asc' }
      ]
    });

    // Group by worker
    const workerDetails = attendances.reduce((acc, attendance) => {
      const workerId = attendance.workerId;
      const workerName = attendance.worker.fullName;
      
      if (!acc[workerId]) {
        acc[workerId] = {
          workerId,
          workerName,
          role: attendance.worker.role,
          totalDays: 0,
          dailyDetails: []
        };
      }
      
      acc[workerId].totalDays += Number(attendance.dayFraction);
      acc[workerId].dailyDetails.push({
        date: attendance.date,
        dayFraction: Number(attendance.dayFraction),
        meal: attendance.meal,
        projectName: attendance.project?.name || 'Không xác định',
        formattedDate: `${attendance.date.getDate().toString().padStart(2, '0')}/${(attendance.date.getMonth() + 1).toString().padStart(2, '0')}/${attendance.date.getFullYear()}`
      });
      
      return acc;
    }, {} as any);

    return NextResponse.json({
      year,
      month,
      workerDetails: Object.values(workerDetails)
    });
  } catch (error) {
    console.error('Error in payroll detail API:', error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi lấy chi tiết bảng công" }, 
      { status: 500 }
    );
  }
}

export const GET = withMiddleware(getPayrollDetail, {
  rateLimit: { requests: 100, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});

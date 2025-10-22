import { PrismaClient } from "@prisma/client";
import { MEAL_COST_VND } from "@/app/config/business";

// Tính lương theo tháng cho một worker
export async function calculateMonthlyPayroll(prisma: PrismaClient, workerId: string, year: number, month: number) {
  // month: 1-12
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));

  const worker = await prisma.worker.findUniqueOrThrow({ where: { id: workerId } });

  const attendances = await prisma.attendance.findMany({
    where: {
      workerId,
      date: { gte: start, lt: end },
    },
  });

  let totalDays = 0;
  let mealTotal = 0;
  for (const a of attendances) {
    totalDays += Number(a.dayFraction);
    const mealKey = a.meal as keyof typeof MEAL_COST_VND;
    mealTotal += MEAL_COST_VND[mealKey];
  }

  const wageTotal = Math.round(totalDays * worker.dailyRateVnd);
  
  // Phụ cấp tháng: chỉ tính một lần cho toàn bộ tháng, không phụ thuộc vào số dự án
  // Đội trưởng nhận phụ cấp trách nhiệm cố định mỗi tháng
  const allowance = worker.monthlyAllowanceVnd ?? 0;
  
  const payable = wageTotal + mealTotal + allowance;

  return {
    workerId,
    year,
    month,
    totalDays,
    wageTotalVnd: wageTotal,
    mealTotalVnd: mealTotal,
    allowanceVnd: allowance,
    adjustmentsVnd: 0,
    payableVnd: payable,
  };
}



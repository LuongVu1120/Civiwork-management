import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withMiddleware } from "@/app/lib/middleware";

async function handler(_req: NextRequest) {
  const [projectsCount, workersCount, attendancesCount, receiptsAgg, expensesAgg, materialsAgg, externalHiresAgg] = await Promise.all([
    prisma.project.count(),
    prisma.worker.count({ where: { isActive: true } }),
    prisma.attendance.count(),
    prisma.receipt.aggregate({ _sum: { amountVnd: true }, _count: true }),
    prisma.expense.aggregate({ _sum: { amountVnd: true }, _count: true }),
    prisma.materialPurchase.aggregate({ where: { isActive: true }, _sum: { totalVnd: true }, _count: true }),
    prisma.externalHire.aggregate({ where: { isActive: true }, _sum: { amountVnd: true }, _count: true })
  ]);

  const totalReceipts = receiptsAgg._sum.amountVnd ?? 0;
  const totalExpenses = expensesAgg._sum.amountVnd ?? 0;
  const totalMaterials = materialsAgg._sum.totalVnd ?? 0;
  const totalExternalHires = externalHiresAgg._sum.amountVnd ?? 0;

  // Recent 5 activities (simple union client-side like structure)
  const [recentReceipts, /*recentExpenses*/, recentMaterials, recentAttendances, recentExternalHires] = await Promise.all([
    prisma.receipt.findMany({ orderBy: { date: "desc" }, take: 2, include: { project: true } }),
    // Bỏ chi phí khỏi hoạt động gần đây theo yêu cầu
    Promise.resolve([] as any[]),
    prisma.materialPurchase.findMany({ where: { isActive: true }, orderBy: { date: "desc" }, take: 1 }),
    prisma.attendance.findMany({ orderBy: { date: "desc" }, take: 3, include: { project: true, worker: true } }),
    prisma.externalHire.findMany({ where: { isActive: true }, orderBy: { startDate: "desc" }, take: 3, include: { project: true } })
  ]);

  const recent = [
    ...recentAttendances.map(a => ({ id: a.id, type: 'attendance', description: `Chấm công ${a.worker?.fullName || ''} - ${a.project?.name || ''}`, date: a.date })),
    ...recentReceipts.map(r => ({ id: r.id, type: 'receipt', description: `Thu tiền ${r.project?.name || ''}`, date: r.date, amount: r.amountVnd })),
    ...recentMaterials.map(m => ({ id: m.id, type: 'material', description: `Vật tư ${m.itemName}`, date: m.date })),
    ...recentExternalHires.map(h => ({ id: h.id, type: 'external_hire', description: `Thuê ngoài ${h.project?.name || ''}: ${h.title}`, date: h.startDate, amount: h.amountVnd }))
  ].sort((a, b) => new Date(b.date as any).getTime() - new Date(a.date as any).getTime()).slice(0, 5);

  return NextResponse.json({
    projects: projectsCount,
    workers: workersCount,
    attendances: attendancesCount,
    receipts: receiptsAgg._count,
    expenses: expensesAgg._count,
    materials: materialsAgg._count,
    externalHires: externalHiresAgg._count,
    totalReceipts,
    totalExpenses,
    totalMaterials,
    totalExternalHires,
    netProfit: totalReceipts - totalExpenses - totalMaterials - totalExternalHires,
    recent
  }, {
    headers: { 'Cache-Control': 'public, max-age=30' }
  });
}

export const GET = withMiddleware(handler, { requireAuth: true });



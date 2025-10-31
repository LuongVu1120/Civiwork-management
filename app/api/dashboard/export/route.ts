import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withMiddleware } from "@/app/lib/middleware";

async function handler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "Thiếu projectId" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "Không tìm thấy công trình" }, { status: 404 });
  }

  const [receipts, expenses, materials, externalHires] = await Promise.all([
    prisma.receipt.findMany({ where: { projectId }, orderBy: { date: "asc" } }),
    prisma.expense.findMany({ where: { projectId }, orderBy: { date: "asc" } }),
    prisma.materialPurchase.findMany({ where: { projectId, isActive: true }, orderBy: { date: "asc" } }),
    prisma.externalHire.findMany({ where: { projectId, isActive: true }, orderBy: { startDate: "asc" } })
  ]);

  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CiviWork";
  const sheet1 = workbook.addWorksheet("Thu tiền");
  sheet1.addRow(["Ngày", "Mô tả", "Số tiền (VND)"]);
  receipts.forEach(r => {
    sheet1.addRow([
      new Date(r.date).toLocaleDateString("vi-VN"),
      r.description || "",
      r.amountVnd
    ]);
  });
  const sheet2 = workbook.addWorksheet("Chi phí");
  sheet2.addRow(["Ngày", "Loại", "Mô tả", "Số tiền (VND)"]);
  expenses.forEach(e => {
    sheet2.addRow([
      new Date(e.date).toLocaleDateString("vi-VN"),
      e.category,
      e.description || "",
      e.amountVnd
    ]);
  });
  const sheet3 = workbook.addWorksheet("Vật tư");
  sheet3.addRow(["Ngày", "Tên", "Số lượng", "Giá tổng", "Tổng tiền", "Nhà cung cấp"]);
  materials.forEach(m => {
    sheet3.addRow([
      new Date(m.date).toLocaleDateString("vi-VN"),
      m.itemName,
      (m.quantityText ? (m.unit ? `${m.quantityText} ${m.unit}` : m.quantityText) : (m.unit ? `${Number(m.quantity)} ${m.unit}` : String(m.quantity))),
      m.unitPriceVnd,
      m.totalVnd,
      m.supplier || ""
    ]);
  });

  // External Hires sheet
  const sheet4 = workbook.addWorksheet("Thuê ngoài");
  sheet4.addRow(["Bắt đầu", "Kết thúc", "Tiêu đề", "Mô tả", "Số tiền (VND)"]);
  externalHires.forEach(h => {
    sheet4.addRow([
      new Date(h.startDate).toLocaleDateString("vi-VN"),
      new Date(h.endDate).toLocaleDateString("vi-VN"),
      h.title,
      h.description || "",
      h.amountVnd
    ]);
  });

  // Summary sheet
  const sumSheet = workbook.addWorksheet("Tổng hợp");
  const totalReceipts = receipts.reduce((s, r) => s + r.amountVnd, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amountVnd, 0);
  const totalMaterials = materials.reduce((s, m) => s + m.totalVnd, 0);
  const totalExternalHires = externalHires.reduce((s, h) => s + h.amountVnd, 0);
  sumSheet.addRow(["Công trình", project.name]);
  if (project.startDate) sumSheet.addRow(["Ngày bắt đầu", new Date(project.startDate as any).toLocaleDateString("vi-VN")]);
  if (project.endDate) sumSheet.addRow(["Ngày đóng", new Date(project.endDate as any).toLocaleDateString("vi-VN")]);
  sumSheet.addRow(["Tổng thu", totalReceipts]);
  sumSheet.addRow(["Tổng chi", totalExpenses]);
  sumSheet.addRow(["Vật tư", totalMaterials]);
  sumSheet.addRow(["Thuê ngoài", totalExternalHires]);
  sumSheet.addRow(["Lợi nhuận", totalReceipts - totalExpenses - totalMaterials - totalExternalHires]);

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="civiwork-${project.name.replace(/[^a-z0-9-_]/gi,'_')}.xlsx"`
    }
  });
}

export const GET = withMiddleware(handler, { requireAuth: true });



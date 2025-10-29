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

  const [receipts, expenses, materials] = await Promise.all([
    prisma.receipt.findMany({ where: { projectId }, orderBy: { date: "asc" } }),
    prisma.expense.findMany({ where: { projectId }, orderBy: { date: "asc" } }),
    prisma.materialPurchase.findMany({ where: { projectId }, orderBy: { date: "asc" } })
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

  // Summary sheet
  const sumSheet = workbook.addWorksheet("Tổng hợp");
  const totalReceipts = receipts.reduce((s, r) => s + r.amountVnd, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amountVnd, 0);
  const totalMaterials = materials.reduce((s, m) => s + m.totalVnd, 0);
  sumSheet.addRow(["Công trình", project.name]);
  sumSheet.addRow(["Tổng thu", totalReceipts]);
  sumSheet.addRow(["Tổng chi", totalExpenses]);
  sumSheet.addRow(["Vật tư", totalMaterials]);
  sumSheet.addRow(["Lợi nhuận", totalReceipts - totalExpenses - totalMaterials]);

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



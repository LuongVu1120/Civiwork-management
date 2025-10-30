import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withMiddleware } from "@/app/lib/middleware";

async function completeProject(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body as { id?: string };
    if (!id) {
      return NextResponse.json({ error: "ID công trình là bắt buộc" }, { status: 400 });
    }
    const updated = await prisma.project.update({
      where: { id },
      data: { isCompleted: true, endDate: new Date() }
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error completing project:", error);
    return NextResponse.json({ error: "Không thể hoàn thành công trình" }, { status: 500 });
  }
}

export const POST = withMiddleware(completeProject, {
  rateLimit: { requests: 20, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});



import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withMiddleware } from "@/app/lib/middleware";

async function getProjects(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status'); // all | active | completed
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));
  const where =
    status === 'active'
      ? { isCompleted: false }
      : status === 'completed'
      ? { isCompleted: true }
      : undefined;
  const [total, projects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page-1)*limit, take: limit })
  ]);
  return NextResponse.json({ items: projects, page, limit, total });
}

export const GET = withMiddleware(getProjects, {
  rateLimit: { requests: 100, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});

async function createProject(request: NextRequest) {
  try {
    const body = await request.json();
    const data: any = { ...body };
    if (body.startDate) data.startDate = new Date(body.startDate);
    if (body.endDate) data.endDate = new Date(body.endDate);
    const created = await prisma.project.create({ data });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: "Không thể tạo công trình" }, 
      { status: 500 }
    );
  }
}

export const POST = withMiddleware(createProject, {
  rateLimit: { requests: 20, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});

async function updateProject(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: "ID công trình là bắt buộc" }, 
        { status: 400 }
      );
    }

    const data: any = { ...updateData };
    if (updateData.startDate !== undefined) data.startDate = updateData.startDate ? new Date(updateData.startDate) : null;
    if (updateData.endDate !== undefined) data.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
    const updated = await prisma.project.update({ where: { id }, data });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: "Không thể cập nhật công trình" }, 
      { status: 500 }
    );
  }
}

export const PUT = withMiddleware(updateProject, {
  rateLimit: { requests: 20, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});

async function completeProject(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID công trình là bắt buộc' }, { status: 400 });
    }
    const updated = await prisma.project.update({
      where: { id },
      data: { isCompleted: true, endDate: new Date() }
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error completing project:', error);
    return NextResponse.json({ error: 'Không thể hoàn thành công trình' }, { status: 500 });
  }
}

export const POST_COMPLETE = withMiddleware(completeProject, {
  rateLimit: { requests: 20, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});

// Xóa công trình đã được loại bỏ theo yêu cầu: không xuất DELETE endpoint



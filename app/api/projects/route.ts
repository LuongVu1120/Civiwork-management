import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withMiddleware } from "@/app/lib/middleware";

async function getProjects(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status'); // all | active | completed
  const where =
    status === 'active'
      ? { isCompleted: false }
      : status === 'completed'
      ? { isCompleted: true }
      : undefined;
  const projects = await prisma.project.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json(projects);
}

export const GET = withMiddleware(getProjects, {
  rateLimit: { requests: 100, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});

async function createProject(request: NextRequest) {
  try {
    const body = await request.json();
    const created = await prisma.project.create({ data: body });
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

    const updated = await prisma.project.update({
      where: { id },
      data: updateData
    });
    
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
      data: { isCompleted: true, completedAt: new Date() }
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



import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withMiddleware } from "@/app/lib/middleware";

async function getProjects(request: NextRequest) {
  const projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
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

async function deleteProject(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "ID công trình là bắt buộc" }, 
        { status: 400 }
      );
    }

    await prisma.project.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: "Không thể xóa công trình" }, 
      { status: 500 }
    );
  }
}

export const DELETE = withMiddleware(deleteProject, {
  rateLimit: { requests: 20, windowMs: 15 * 60 * 1000 },
  requireAuth: true
});



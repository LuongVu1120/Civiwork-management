import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const body = await request.json();
  const created = await prisma.project.create({ data: body });
  return NextResponse.json(created, { status: 201 });
}



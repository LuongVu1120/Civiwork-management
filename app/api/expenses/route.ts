import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const list = await prisma.expense.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const body = await request.json();
  const created = await prisma.expense.create({ data: body });
  return NextResponse.json(created, { status: 201 });
}



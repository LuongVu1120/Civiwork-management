import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// GET /api/test-db
export async function GET(request: NextRequest) {
  try {
    // Test basic connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Test each table
    const tableTests = [
      { name: 'Worker', prisma: prisma.worker },
      { name: 'Project', prisma: prisma.project },
      { name: 'Attendance', prisma: prisma.attendance },
      { name: 'Receipt', prisma: prisma.receipt },
      { name: 'Expense', prisma: prisma.expense },
      { name: 'MaterialPurchase', prisma: prisma.materialPurchase }
    ];
    const results: any = {};
    
    for (const { name, prisma: prismaModel } of tableTests) {
      try {
        const count = await (prismaModel as any).count();
        results[name] = { count, status: 'OK' };
      } catch (error) {
        results[name] = { error: error instanceof Error ? error.message : 'Unknown error', status: 'ERROR' };
        console.error(`❌ ${name}:`, error);
      }
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Database test completed',
      results
    });
    
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Database test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

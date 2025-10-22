import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

// Enhanced Prisma client with connection pooling and logging
export const prisma: PrismaClient = global.prismaGlobal ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Connection pooling configuration
  __internal: {
    engine: {
      connectTimeout: 60000,
      queryTimeout: 60000,
    }
  }
});

// Graceful shutdown
if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Database statistics
export async function getDatabaseStats() {
  try {
    const [workerCount, projectCount, attendanceCount, receiptCount, expenseCount] = await Promise.all([
      prisma.worker.count(),
      prisma.project.count(),
      prisma.attendance.count(),
      prisma.receipt.count(),
      prisma.expense.count()
    ]);

    return {
      workers: workerCount,
      projects: projectCount,
      attendances: attendanceCount,
      receipts: receiptCount,
      expenses: expenseCount
    };
  } catch (error) {
    console.error('Failed to get database stats:', error);
    return null;
  }
}



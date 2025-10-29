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
  }
});

// Graceful shutdown
if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}

// Connection health check with retry
export async function checkDatabaseConnection(retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error(`Database connection attempt ${i + 1} failed:`, error);
      if (i === retries - 1) {
        console.error('All database connection attempts failed');
        return false;
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  return false;
}

// Retry wrapper for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Operation attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw new Error('All retry attempts failed');
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



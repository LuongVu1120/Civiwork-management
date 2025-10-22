import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseConnection, getDatabaseStats } from '@/app/lib/prisma';
import { cache } from '@/app/lib/cache';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check database connection
    const dbConnected = await checkDatabaseConnection();
    
    // Get database stats
    const dbStats = await getDatabaseStats();
    
    // Check cache status
    const cacheStatus = {
      size: cache['store']?.size || 0,
      healthy: true
    };
    
    const responseTime = Date.now() - startTime;
    
    const health = {
      status: dbConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      database: {
        connected: dbConnected,
        stats: dbStats
      },
      cache: cacheStatus,
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    };
    
    return NextResponse.json(health, {
      status: dbConnected ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      database: { connected: false },
      cache: { healthy: false }
    }, { status: 503 });
  }
}

// Simple logging system (in production, use proper logging service like Winston or Pino)

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
  userId?: string;
  requestId?: string;
}

class Logger {
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  constructor(level: LogLevel = LogLevel.INFO) {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(level: LogLevel, message: string, context?: any, userId?: string, requestId?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId,
      requestId
    };
  }

  private log(level: LogLevel, message: string, context?: any, userId?: string, requestId?: string): void {
    if (!this.shouldLog(level)) return;

    const entry = this.formatMessage(level, message, context, userId, requestId);
    
    // Add to in-memory store
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with colors
    const levelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
    const colors = ['\x1b[31m', '\x1b[33m', '\x1b[36m', '\x1b[37m']; // Red, Yellow, Cyan, White
    const reset = '\x1b[0m';

    const color = colors[level] || reset;
    const levelName = levelNames[level] || 'UNKNOWN';
    
    console.log(
      `${color}[${entry.timestamp}] ${levelName}: ${message}${reset}`,
      context ? JSON.stringify(context, null, 2) : ''
    );

    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(entry);
    }
  }

  private sendToExternalService(entry: LogEntry): void {
    // In production, integrate with services like:
    // - Sentry for error tracking
    // - DataDog for monitoring
    // - CloudWatch for AWS
    // - LogDNA, Papertrail, etc.
    
    // For now, just log to console in production
    if (entry.level === LogLevel.ERROR) {
      console.error('CRITICAL ERROR:', entry);
    }
  }

  error(message: string, context?: any, userId?: string, requestId?: string): void {
    this.log(LogLevel.ERROR, message, context, userId, requestId);
  }

  warn(message: string, context?: any, userId?: string, requestId?: string): void {
    this.log(LogLevel.WARN, message, context, userId, requestId);
  }

  info(message: string, context?: any, userId?: string, requestId?: string): void {
    this.log(LogLevel.INFO, message, context, userId, requestId);
  }

  debug(message: string, context?: any, userId?: string, requestId?: string): void {
    this.log(LogLevel.DEBUG, message, context, userId, requestId);
  }

  // Get recent logs
  getLogs(level?: LogLevel, limit: number = 100): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level !== undefined) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }
    
    return filteredLogs.slice(-limit);
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  // Set log level
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

// Create logger instance
export const logger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
);

// Audit logging for important business operations
export class AuditLogger {
  static logUserAction(action: string, userId: string, details?: any): void {
    logger.info(`User Action: ${action}`, {
      action,
      userId,
      details,
      type: 'USER_ACTION'
    });
  }

  static logDataChange(operation: 'CREATE' | 'UPDATE' | 'DELETE', table: string, recordId: string, userId: string, changes?: any): void {
    logger.info(`Data Change: ${operation} ${table}`, {
      operation,
      table,
      recordId,
      userId,
      changes,
      type: 'DATA_CHANGE'
    });
  }

  static logSecurityEvent(event: string, details: any, userId?: string): void {
    logger.warn(`Security Event: ${event}`, {
      event,
      details,
      userId,
      type: 'SECURITY'
    });
  }

  static logPerformance(operation: string, duration: number, details?: any): void {
    logger.info(`Performance: ${operation}`, {
      operation,
      duration: `${duration}ms`,
      details,
      type: 'PERFORMANCE'
    });
  }
}

// Request logging middleware
export function logRequest(request: NextRequest, response: Response, duration: number): void {
  const { method, url } = request;
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  logger.info(`${method} ${url}`, {
    method,
    url,
    status: response.status,
    duration: `${duration}ms`,
    ip,
    userAgent,
    type: 'REQUEST'
  });
}

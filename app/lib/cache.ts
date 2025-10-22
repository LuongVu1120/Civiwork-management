// Simple in-memory cache (in production, use Redis)
class Cache {
  private store = new Map<string, { value: any; expires: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, value: any, ttl: number = this.defaultTTL): void {
    const expires = Date.now() + ttl;
    this.store.set(key, { value, expires });
  }

  get(key: string): any | null {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.store.delete(key);
      return null;
    }
    
    return item.value;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.expires) {
        this.store.delete(key);
      }
    }
  }
}

export const cache = new Cache();

// Cache decorator for functions
export function cached(ttl: number = 5 * 60 * 1000) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyName}:${JSON.stringify(args)}`;
      const cached = cache.get(cacheKey);
      
      if (cached !== null) {
        return cached;
      }
      
      const result = await method.apply(this, args);
      cache.set(cacheKey, result, ttl);
      return result;
    };
  };
}

// Cache utility functions
export const cacheKeys = {
  workers: 'workers:all',
  projects: 'projects:all',
  receipts: 'receipts:all',
  expenses: 'expenses:all',
  materials: 'materials:all',
  dashboard: 'dashboard:stats',
  payroll: (year: number, month: number) => `payroll:${year}:${month}`
};

// Cache invalidation helpers
export function invalidateWorkers(): void {
  cache.delete(cacheKeys.workers);
  cache.delete(cacheKeys.dashboard);
}

export function invalidateProjects(): void {
  cache.delete(cacheKeys.projects);
  cache.delete(cacheKeys.dashboard);
}

export function invalidateReceipts(): void {
  cache.delete(cacheKeys.receipts);
  cache.delete(cacheKeys.dashboard);
}

export function invalidateExpenses(): void {
  cache.delete(cacheKeys.expenses);
  cache.delete(cacheKeys.dashboard);
}

export function invalidateMaterials(): void {
  cache.delete(cacheKeys.materials);
  cache.delete(cacheKeys.dashboard);
}

export function invalidatePayroll(year: number, month: number): void {
  cache.delete(cacheKeys.payroll(year, month));
  cache.delete(cacheKeys.dashboard);
}

// Cleanup expired cache entries every 10 minutes
setInterval(() => {
  cache.cleanup();
}, 10 * 60 * 1000);

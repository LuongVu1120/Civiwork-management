import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/workers/route';

// Mock Prisma
jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    worker: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock middleware
jest.mock('@/app/lib/middleware', () => ({
  withMiddleware: (handler: any) => handler,
}));

describe('/api/workers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/workers', () => {
    it('should return workers list', async () => {
      const mockWorkers = [
        {
          id: '1',
          fullName: 'Nguyễn Văn A',
          role: 'THO_XAY',
          dailyRateVnd: 420000,
          monthlyAllowanceVnd: 0,
          isActive: true,
        },
      ];

      const { prisma } = require('@/app/lib/prisma');
      prisma.worker.findMany.mockResolvedValue(mockWorkers);

      const request = new NextRequest('http://localhost:3000/api/workers');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockWorkers);
      expect(prisma.worker.findMany).toHaveBeenCalledWith({
        orderBy: { fullName: 'asc' },
        where: { isActive: true },
      });
    });
  });

  describe('POST /api/workers', () => {
    it('should create a new worker', async () => {
      const newWorker = {
        fullName: 'Nguyễn Văn B',
        role: 'DOI_TRUONG',
        dailyRateVnd: 500000,
        monthlyAllowanceVnd: 1500000,
      };

      const createdWorker = {
        id: '2',
        ...newWorker,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { prisma } = require('@/app/lib/prisma');
      prisma.worker.create.mockResolvedValue(createdWorker);

      const request = new NextRequest('http://localhost:3000/api/workers', {
        method: 'POST',
        body: JSON.stringify(newWorker),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(createdWorker);
      expect(prisma.worker.create).toHaveBeenCalledWith({
        data: newWorker,
      });
    });

    it('should handle validation errors', async () => {
      const invalidWorker = {
        fullName: '', // Invalid: empty name
        role: 'INVALID_ROLE', // Invalid role
        dailyRateVnd: -100, // Invalid: negative rate
        monthlyAllowanceVnd: -50, // Invalid: negative allowance
      };

      const request = new NextRequest('http://localhost:3000/api/workers', {
        method: 'POST',
        body: JSON.stringify(invalidWorker),
        headers: { 'Content-Type': 'application/json' },
      });

      // This should be handled by middleware validation
      // The actual error handling depends on middleware implementation
      await expect(POST(request)).rejects.toThrow();
    });
  });
});

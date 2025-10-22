import { CreateWorkerSchema, CreateProjectSchema, CreateAttendanceSchema } from '@/app/lib/schemas';

describe('Validation Schemas', () => {
  describe('CreateWorkerSchema', () => {
    it('should validate correct worker data', () => {
      const validData = {
        fullName: 'Nguyễn Văn A',
        role: 'THO_XAY',
        dailyRateVnd: 420000,
        monthlyAllowanceVnd: 0
      };

      const result = CreateWorkerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid role', () => {
      const invalidData = {
        fullName: 'Nguyễn Văn A',
        role: 'INVALID_ROLE',
        dailyRateVnd: 420000,
        monthlyAllowanceVnd: 0
      };

      const result = CreateWorkerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative daily rate', () => {
      const invalidData = {
        fullName: 'Nguyễn Văn A',
        role: 'THO_XAY',
        dailyRateVnd: -100,
        monthlyAllowanceVnd: 0
      };

      const result = CreateWorkerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty full name', () => {
      const invalidData = {
        fullName: '',
        role: 'THO_XAY',
        dailyRateVnd: 420000,
        monthlyAllowanceVnd: 0
      };

      const result = CreateWorkerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateProjectSchema', () => {
    it('should validate correct project data', () => {
      const validData = {
        name: 'Dự án xây dựng nhà A',
        clientName: 'Công ty ABC',
        address: '123 Đường ABC, Quận 1, TP.HCM',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        notes: 'Ghi chú dự án'
      };

      const result = CreateProjectSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate minimal project data', () => {
      const validData = {
        name: 'Dự án xây dựng nhà A'
      };

      const result = CreateProjectSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty project name', () => {
      const invalidData = {
        name: ''
      };

      const result = CreateProjectSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateAttendanceSchema', () => {
    it('should validate correct attendance data', () => {
      const validData = {
        date: '2024-01-01T08:00:00Z',
        projectId: 'clx123456789',
        workerId: 'clx987654321',
        dayFraction: 1.0,
        meal: 'FULL_DAY',
        notes: 'Làm việc bình thường'
      };

      const result = CreateAttendanceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid day fraction', () => {
      const invalidData = {
        date: '2024-01-01T08:00:00Z',
        projectId: 'clx123456789',
        workerId: 'clx987654321',
        dayFraction: 1.5, // Invalid: > 1
        meal: 'FULL_DAY'
      };

      const result = CreateAttendanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid meal option', () => {
      const invalidData = {
        date: '2024-01-01T08:00:00Z',
        projectId: 'clx123456789',
        workerId: 'clx987654321',
        dayFraction: 1.0,
        meal: 'INVALID_MEAL'
      };

      const result = CreateAttendanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

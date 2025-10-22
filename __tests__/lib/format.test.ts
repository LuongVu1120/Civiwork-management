import { formatVnd } from '@/app/lib/format';

describe('formatVnd', () => {
  it('should format positive numbers correctly', () => {
    expect(formatVnd(1000000)).toBe('1.000.000 ₫');
    expect(formatVnd(500000)).toBe('500.000 ₫');
    expect(formatVnd(100)).toBe('100 ₫');
  });

  it('should format zero correctly', () => {
    expect(formatVnd(0)).toBe('0 ₫');
  });

  it('should handle string inputs', () => {
    expect(formatVnd('1000000')).toBe('1.000.000 ₫');
    expect(formatVnd('0')).toBe('0 ₫');
  });

  it('should handle null and undefined', () => {
    expect(formatVnd(null)).toBe('0 ₫');
    expect(formatVnd(undefined)).toBe('0 ₫');
  });

  it('should format large numbers correctly', () => {
    expect(formatVnd(1000000000)).toBe('1.000.000.000 ₫');
    expect(formatVnd(1234567890)).toBe('1.234.567.890 ₫');
  });
});

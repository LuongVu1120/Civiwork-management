import { z } from 'zod';

// Worker schemas
export const WorkerRoleSchema = z.enum(['DOI_TRUONG', 'THO_XAY', 'THO_PHU']);

export const CreateWorkerSchema = z.object({
  fullName: z.string().min(1, 'Họ tên là bắt buộc').max(100, 'Họ tên không được quá 100 ký tự'),
  role: WorkerRoleSchema,
  dailyRateVnd: z.number().int().min(0, 'Lương ngày phải >= 0').max(10000000, 'Lương ngày quá cao'),
  monthlyAllowanceVnd: z.number().int().min(0, 'Phụ cấp tháng phải >= 0').max(50000000, 'Phụ cấp tháng quá cao')
});

export const UpdateWorkerSchema = CreateWorkerSchema.partial();

// Project schemas
export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Tên dự án là bắt buộc').max(200, 'Tên dự án không được quá 200 ký tự'),
  clientName: z.string().max(100, 'Tên khách hàng không được quá 100 ký tự').optional(),
  address: z.string().max(500, 'Địa chỉ không được quá 500 ký tự').optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  notes: z.string().max(1000, 'Ghi chú không được quá 1000 ký tự').optional()
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

// Attendance schemas
export const MealOptionSchema = z.enum(['FULL_DAY', 'HALF_DAY', 'NONE']);

export const CreateAttendanceSchema = z.object({
  date: z.string().datetime('Ngày không hợp lệ'),
  projectId: z.string().cuid('ID dự án không hợp lệ'),
  workerId: z.string().cuid('ID nhân viên không hợp lệ'),
  dayFraction: z.number().min(0).max(1, 'Phần ngày phải từ 0 đến 1'),
  meal: MealOptionSchema,
  notes: z.string().max(500, 'Ghi chú không được quá 500 ký tự').optional()
});

export const UpdateAttendanceSchema = CreateAttendanceSchema.partial();

// Bulk Attendance schema
export const CreateAttendanceBulkSchema = z.object({
  date: z.string().datetime('Ngày không hợp lệ'),
  projectId: z.string().cuid('ID dự án không hợp lệ'),
  workerIds: z.array(z.string().cuid('ID nhân viên không hợp lệ')).min(1, 'Chọn ít nhất 1 công nhân'),
  dayFraction: z.number().min(0).max(1, 'Phần ngày phải từ 0 đến 1'),
  meal: MealOptionSchema,
  notes: z.string().max(500, 'Ghi chú không được quá 500 ký tự').optional()
});

// Receipt schemas
export const CreateReceiptSchema = z.object({
  projectId: z.string().cuid('ID dự án không hợp lệ'),
  date: z.string().datetime('Ngày không hợp lệ'),
  amountVnd: z.number().int().min(0, 'Số tiền phải >= 0').max(10000000000, 'Số tiền quá cao'),
  description: z.string().max(500, 'Mô tả không được quá 500 ký tự').optional(),
  milestone: z.number().int().min(0).max(100, 'Tiến độ phải từ 0-100%').optional()
});

export const UpdateReceiptSchema = CreateReceiptSchema.partial();

// Expense schemas
export const ExpenseCategorySchema = z.enum(['WAGE', 'MEAL', 'MATERIAL', 'SUBCONTRACT', 'TOOLING', 'MISC']);

export const CreateExpenseSchema = z.object({
  projectId: z.string().cuid('ID dự án không hợp lệ'),
  date: z.string().datetime('Ngày không hợp lệ'),
  category: ExpenseCategorySchema,
  amountVnd: z.number().int().min(0, 'Số tiền phải >= 0').max(10000000000, 'Số tiền quá cao'),
  description: z.string().max(500, 'Mô tả không được quá 500 ký tự').optional(),
  workerId: z.string().cuid('ID nhân viên không hợp lệ').optional(),
  materialId: z.string().cuid('ID vật tư không hợp lệ').optional(),
  vendorName: z.string().max(100, 'Tên nhà cung cấp không được quá 100 ký tự').optional()
});

export const UpdateExpenseSchema = CreateExpenseSchema.partial();

// Material schemas
export const CreateMaterialSchema = z.object({
  projectId: z.string().cuid('ID dự án không hợp lệ'),
  date: z.string().datetime('Ngày không hợp lệ'),
  itemName: z.string().min(1, 'Tên vật tư là bắt buộc').max(200, 'Tên vật tư không được quá 200 ký tự'),
  unit: z.string().max(20, 'Đơn vị không được quá 20 ký tự').optional(),
  quantityText: z.string().min(1, 'Số lượng là bắt buộc'),
  unitPriceVnd: z.number().int().min(0, 'Giá tổng phải >= 0').max(10000000000, 'Giá tổng quá cao'),
  totalVnd: z.number().int().min(0, 'Tổng tiền phải >= 0').max(10000000000, 'Tổng tiền quá cao'),
  supplier: z.string().max(100, 'Tên nhà cung cấp không được quá 100 ký tự').optional()
});

export const UpdateMaterialSchema = CreateMaterialSchema.partial();

// External Hire schemas
export const CreateExternalHireSchema = z.object({
  projectId: z.string().cuid('ID dự án không hợp lệ'),
  title: z.string().min(1, 'Tiêu đề là bắt buộc').max(200, 'Tiêu đề quá dài'),
  description: z.string().max(1000).optional().nullable(),
  startDate: z.string().datetime('Ngày bắt đầu không hợp lệ'),
  endDate: z.string().datetime('Ngày kết thúc không hợp lệ'),
  amountVnd: z.number().int().min(0, 'Số tiền phải >= 0').max(10000000000, 'Số tiền quá cao')
});

export const UpdateExternalHireSchema = CreateExternalHireSchema.partial().extend({
  id: z.string().cuid('ID không hợp lệ')
});

// Payroll schemas
export const CreatePayrollSchema = z.object({
  workerId: z.string().cuid('ID nhân viên không hợp lệ'),
  year: z.number().int().min(2020).max(2030, 'Năm không hợp lệ'),
  month: z.number().int().min(1).max(12, 'Tháng phải từ 1-12'),
  totalDays: z.number().min(0).max(31, 'Số ngày không hợp lệ'),
  wageTotalVnd: z.number().int().min(0, 'Tổng lương phải >= 0'),
  mealTotalVnd: z.number().int().min(0, 'Tổng ăn uống phải >= 0'),
  allowanceVnd: z.number().int().min(0, 'Phụ cấp phải >= 0'),
  adjustmentsVnd: z.number().int().default(0),
  payableVnd: z.number().int().min(0, 'Số tiền phải trả phải >= 0')
});

// Query parameter schemas
export const PaginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default(1),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default(20)
});

export const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

// Error response schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
  code: z.string().optional()
});

export type CreateWorkerInput = z.infer<typeof CreateWorkerSchema>;
export type UpdateWorkerInput = z.infer<typeof UpdateWorkerSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type CreateAttendanceInput = z.infer<typeof CreateAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof UpdateAttendanceSchema>;
export type CreateAttendanceBulkInput = z.infer<typeof CreateAttendanceBulkSchema>;
export type CreateReceiptInput = z.infer<typeof CreateReceiptSchema>;
export type UpdateReceiptInput = z.infer<typeof UpdateReceiptSchema>;
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;
export type CreateMaterialInput = z.infer<typeof CreateMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof UpdateMaterialSchema>;
export type CreatePayrollInput = z.infer<typeof CreatePayrollSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type DateRangeInput = z.infer<typeof DateRangeSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type CreateExternalHireInput = z.infer<typeof CreateExternalHireSchema>;
export type UpdateExternalHireInput = z.infer<typeof UpdateExternalHireSchema>;

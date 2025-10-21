export const MEAL_COST_VND: Record<"FULL_DAY" | "HALF_DAY" | "NONE", number> = {
  FULL_DAY: 80000,
  HALF_DAY: 40000,
  NONE: 0,
};

// Có thể mở rộng: tải danh sách ngày lễ VN theo năm hoặc cấu hình thủ công
export const DEFAULT_HOLIDAYS: { date: string; name: string }[] = [];

export const DEFAULT_ROLE_RATES_VND: Record<string, number> = {
  DOI_TRUONG: 500000,
  THO_XAY: 420000,
  THO_PHU: 320000,
  THUE_NGOAI: 0, // thuê ngoài ghi nhận theo chi phí thực, không tính qua chấm công
};

export const DEFAULT_MONTHLY_ALLOWANCE_VND = 1500000; // phụ cấp trách nhiệm thợ chính/đội trưởng



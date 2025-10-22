// Ví dụ minh họa cách tính lương và phụ cấp

export interface PayrollExample {
  workerName: string;
  role: string;
  dailyRate: number;
  monthlyAllowance: number;
  attendances: {
    date: string;
    project: string;
    dayFraction: number;
    meal: 'FULL_DAY' | 'HALF_DAY' | 'NONE';
  }[];
  calculation: {
    totalDays: number;
    wageTotal: number;
    mealTotal: number;
    allowance: number;
    totalPayable: number;
  };
}

export const payrollExamples: PayrollExample[] = [
  {
    workerName: "Nguyễn Văn A",
    role: "Đội trưởng",
    dailyRate: 500000,
    monthlyAllowance: 1500000, // Phụ cấp cố định mỗi tháng
    attendances: [
      { date: "2024-01-01", project: "Dự án A", dayFraction: 1.0, meal: "FULL_DAY" },
      { date: "2024-01-02", project: "Dự án A", dayFraction: 1.0, meal: "FULL_DAY" },
      { date: "2024-01-03", project: "Dự án B", dayFraction: 0.5, meal: "HALF_DAY" },
      { date: "2024-01-04", project: "Dự án C", dayFraction: 1.0, meal: "FULL_DAY" },
      { date: "2024-01-05", project: "Dự án A", dayFraction: 1.0, meal: "FULL_DAY" },
    ],
    calculation: {
      totalDays: 4.5, // Tổng số ngày làm việc
      wageTotal: 2250000, // 4.5 * 500,000
      mealTotal: 360000, // 4 * 80,000 + 1 * 40,000
      allowance: 1500000, // Phụ cấp cố định cho toàn tháng
      totalPayable: 4110000 // 2,250,000 + 360,000 + 1,500,000
    }
  },
  {
    workerName: "Trần Văn B",
    role: "Thợ xây",
    dailyRate: 420000,
    monthlyAllowance: 0, // Không có phụ cấp
    attendances: [
      { date: "2024-01-01", project: "Dự án A", dayFraction: 1.0, meal: "FULL_DAY" },
      { date: "2024-01-02", project: "Dự án A", dayFraction: 1.0, meal: "FULL_DAY" },
      { date: "2024-01-03", project: "Dự án B", dayFraction: 1.0, meal: "FULL_DAY" },
    ],
    calculation: {
      totalDays: 3.0,
      wageTotal: 1260000, // 3 * 420,000
      mealTotal: 240000, // 3 * 80,000
      allowance: 0, // Không có phụ cấp
      totalPayable: 1500000 // 1,260,000 + 240,000 + 0
    }
  }
];

// Hàm tính toán minh họa
export function calculatePayrollExample(
  dailyRate: number,
  monthlyAllowance: number,
  attendances: PayrollExample['attendances']
) {
  const MEAL_COST = {
    FULL_DAY: 80000,
    HALF_DAY: 40000,
    NONE: 0
  };

  const totalDays = attendances.reduce((sum, a) => sum + a.dayFraction, 0);
  const wageTotal = Math.round(totalDays * dailyRate);
  const mealTotal = attendances.reduce((sum, a) => sum + MEAL_COST[a.meal], 0);
  const allowance = monthlyAllowance; // Phụ cấp cố định cho toàn tháng
  const totalPayable = wageTotal + mealTotal + allowance;

  return {
    totalDays,
    wageTotal,
    mealTotal,
    allowance,
    totalPayable
  };
}

// Giải thích logic phụ cấp
export const allowanceExplanation = {
  title: "Cách tính phụ cấp đội trưởng",
  description: "Phụ cấp của đội trưởng là khoản cố định hàng tháng, không phụ thuộc vào:",
  points: [
    "Số lượng dự án tham gia trong tháng",
    "Số ngày làm việc thực tế",
    "Hiệu suất công việc",
    "Kết quả dự án"
  ],
  note: "Phụ cấp được tính một lần duy nhất cho toàn bộ tháng, bất kể đội trưởng có làm việc ở bao nhiêu dự án khác nhau."
};

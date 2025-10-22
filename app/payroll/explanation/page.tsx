'use client';

import { PageHeader } from "@/app/lib/navigation";
import { ModernCard } from "@/app/lib/modern-components";
import { payrollExamples, allowanceExplanation } from "@/app/lib/payroll-example";

export default function PayrollExplanationPage() {
  return (
    <div className="min-h-dvh bg-gray-50 mx-auto max-w-4xl">
      <PageHeader title="Giải thích tính lương" />
      <div className="p-4 space-y-6">
        
        {/* Giải thích phụ cấp */}
        <ModernCard className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {allowanceExplanation.title}
          </h2>
          <p className="text-gray-700 mb-4">
            {allowanceExplanation.description}
          </p>
          <ul className="space-y-2 mb-4">
            {allowanceExplanation.points.map((point, index) => (
              <li key={index} className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span className="text-gray-700">{point}</span>
              </li>
            ))}
          </ul>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 font-medium">
              {allowanceExplanation.note}
            </p>
          </div>
        </ModernCard>

        {/* Ví dụ minh họa */}
        <ModernCard className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Ví dụ minh họa
          </h2>
          
          {payrollExamples.map((example, index) => (
            <div key={index} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">
                {example.workerName} ({example.role})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Thông tin cơ bản:</h4>
                  <div className="space-y-1 text-sm">
                    <div>Lương/ngày: {example.dailyRate.toLocaleString()}đ</div>
                    <div>Phụ cấp/tháng: {example.monthlyAllowance.toLocaleString()}đ</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Chấm công tháng:</h4>
                  <div className="space-y-1 text-sm">
                    {example.attendances.map((att, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{att.date} - {att.project}</span>
                        <span>{att.dayFraction} ngày</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium text-gray-700 mb-3">Cách tính:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tổng ngày công:</span>
                    <span>{example.calculation.totalDays} ngày</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lương cơ bản:</span>
                    <span>{example.calculation.wageTotal.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chi phí ăn uống:</span>
                    <span>{example.calculation.mealTotal.toLocaleString()}đ</span>
                  </div>
                  {example.calculation.allowance > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>Phụ cấp tháng (cố định):</span>
                      <span>{example.calculation.allowance.toLocaleString()}đ</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Tổng phải trả:</span>
                    <span className="text-green-600">
                      {example.calculation.totalPayable.toLocaleString()}đ
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </ModernCard>

        {/* Quy tắc tính lương */}
        <ModernCard className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Quy tắc tính lương
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">1. Lương cơ bản</h3>
              <p className="text-gray-700 text-sm">
                = Số ngày công × Lương/ngày
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">2. Chi phí ăn uống</h3>
              <p className="text-gray-700 text-sm">
                = Tổng chi phí ăn uống theo từng ngày chấm công
              </p>
              <ul className="text-sm text-gray-600 mt-1 ml-4">
                <li>• Cả ngày: 80.000đ</li>
                <li>• Nửa ngày: 40.000đ</li>
                <li>• Không ăn: 0đ</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">3. Phụ cấp tháng</h3>
              <p className="text-gray-700 text-sm">
                = Phụ cấp cố định (chỉ áp dụng cho đội trưởng)
              </p>
              <ul className="text-sm text-gray-600 mt-1 ml-4">
                <li>• Đội trưởng: 1.500.000đ/tháng</li>
                <li>• Thợ xây: 0đ</li>
                <li>• Thợ phụ: 0đ</li>
                <li>• Thuê ngoài: 0đ</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">4. Tổng phải trả</h3>
              <p className="text-gray-700 text-sm">
                = Lương cơ bản + Chi phí ăn uống + Phụ cấp tháng
              </p>
            </div>
          </div>
        </ModernCard>

        {/* Lưu ý quan trọng */}
        <ModernCard className="p-6 bg-yellow-50 border-yellow-200">
          <h2 className="text-xl font-bold text-yellow-800 mb-4">
            ⚠️ Lưu ý quan trọng
          </h2>
          <ul className="space-y-2 text-yellow-700">
            <li>• Phụ cấp đội trưởng được tính <strong>một lần duy nhất</strong> cho toàn tháng</li>
            <li>• Không phân bổ phụ cấp theo từng dự án</li>
            <li>• Phụ cấp được trả ngay cả khi đội trưởng không làm việc đủ ngày trong tháng</li>
            <li>• Chỉ có vai trò "Đội trưởng" mới được hưởng phụ cấp</li>
          </ul>
        </ModernCard>
      </div>
    </div>
  );
}

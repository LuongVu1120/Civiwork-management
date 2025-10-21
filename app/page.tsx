export default function Home() {
  const links = [
    { href: "/dashboard", label: "Dashboard", icon: "📊", gradient: "from-blue-500 to-blue-600", hover: "hover:from-blue-600 hover:to-blue-700" },
    { href: "/projects", label: "Công trình", icon: "🏗️", gradient: "from-green-500 to-green-600", hover: "hover:from-green-600 hover:to-green-700" },
    { href: "/attendances", label: "Chấm công", icon: "📅", gradient: "from-purple-500 to-purple-600", hover: "hover:from-purple-600 hover:to-purple-700" },
    { href: "/receipts", label: "Thu tiền", icon: "💰", gradient: "from-emerald-500 to-emerald-600", hover: "hover:from-emerald-600 hover:to-emerald-700" },
    { href: "/expenses", label: "Chi tiền", icon: "💸", gradient: "from-red-500 to-red-600", hover: "hover:from-red-600 hover:to-red-700" },
    { href: "/materials", label: "Vật tư", icon: "🔨", gradient: "from-orange-500 to-orange-600", hover: "hover:from-orange-600 hover:to-orange-700" },
    { href: "/workers", label: "Nhân sự", icon: "👥", gradient: "from-indigo-500 to-indigo-600", hover: "hover:from-indigo-600 hover:to-indigo-700" },
    { href: "/payroll/monthly", label: "Bảng công", icon: "📋", gradient: "from-pink-500 to-pink-600", hover: "hover:from-pink-600 hover:to-pink-700" },
    { href: "/backup", label: "Sao lưu", icon: "💾", gradient: "from-gray-500 to-gray-600", hover: "hover:from-gray-600 hover:to-gray-700" },
    { href: "/test", label: "Test", icon: "🧪", gradient: "from-yellow-500 to-yellow-600", hover: "hover:from-yellow-600 hover:to-yellow-700" },
  ];
  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
      <main className="mx-auto max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            CiviWork
          </h1>
          <p className="text-gray-600 text-lg">Quản lý thu chi & chấm công</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {links.map((l) => (
            <a 
              key={l.href} 
              href={l.href} 
              className={`bg-gradient-to-br ${l.gradient} ${l.hover} text-white rounded-2xl p-6 shadow-lg hover:shadow-xl active:scale-95 transition-all duration-300 group`}
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">{l.icon}</div>
              <div className="font-semibold text-sm">{l.label}</div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}

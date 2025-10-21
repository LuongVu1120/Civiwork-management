import { PrismaClient } from "@prisma/client";
import { DEFAULT_ROLE_RATES_VND, DEFAULT_MONTHLY_ALLOWANCE_VND, DEFAULT_HOLIDAYS } from "../app/config/business";

const prisma = new PrismaClient();

async function main() {
  // Seed a few workers by role with default rates
  const workersData: { fullName: string; role: "DOI_TRUONG" | "THO_XAY" | "THO_PHU" | "THUE_NGOAI" }[] = [
    { fullName: "Đội trưởng A", role: "DOI_TRUONG" },
    { fullName: "Thợ xây B", role: "THO_XAY" },
    { fullName: "Thợ phụ C", role: "THO_PHU" },
  ];

  for (const w of workersData) {
    const existing = await prisma.worker.findFirst({ where: { fullName: w.fullName } });
    if (!existing) {
      await prisma.worker.create({
        data: {
          fullName: w.fullName,
          role: w.role,
          dailyRateVnd: DEFAULT_ROLE_RATES_VND[w.role],
          monthlyAllowanceVnd: w.role === "DOI_TRUONG" ? DEFAULT_MONTHLY_ALLOWANCE_VND : 0,
        },
      });
    }
  }

  // Seed holidays if provided
  for (const h of DEFAULT_HOLIDAYS) {
    await prisma.holiday.upsert({
      where: { date: new Date(h.date) },
      update: { name: h.name },
      create: { date: new Date(h.date), name: h.name },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });



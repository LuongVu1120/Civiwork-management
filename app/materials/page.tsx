"use client";
import { useEffect, useState } from "react";
import { formatVnd } from "@/app/lib/format";
import { PageHeader } from "@/app/lib/navigation";
import {  ModernListItem } from "@/app/lib/modern-components";

type Material = { id: string; date: string; itemName: string; totalVnd: number };

export default function MaterialsPage() {
  const [list, setList] = useState<Material[]>([]);
  useEffect(() => { fetch("/api/materials", { cache: "no-store" }).then(r=>r.json()).then(setList); }, []);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 mx-auto max-w-md">
      <PageHeader title="Vật tư" />
      <div className="p-4">
        <div className="space-y-3">
          {list.map(m => (
            <ModernListItem key={m.id} className="hover:scale-105">
              <div className="font-semibold text-lg text-gray-900 mb-1">{m.itemName}</div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {new Date(m.date).toLocaleDateString()}
                </div>
                <div className="text-lg font-bold text-emerald-600">
                  {formatVnd(m.totalVnd)}
                </div>
              </div>
            </ModernListItem>
          ))}
        </div>
      </div>
    </div>
  );
}



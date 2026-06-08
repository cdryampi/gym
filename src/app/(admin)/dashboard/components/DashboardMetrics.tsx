import { Users, Calendar, TrendingUp, Gift, Clock } from "lucide-react";
import { getDashboardMetrics } from "@/lib/data/dashboard-metrics";

export default async function DashboardMetrics() {
  const metrics = await getDashboardMetrics();

  const cards = [
    {
      label: "Socios Activos",
      value: metrics.activeMembers,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Ingresos Mes",
      value: `S/ ${metrics.monthlyIncome.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Nuevos Mes",
      value: metrics.newMembersThisMonth,
      icon: Calendar,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Cumpleaos Mes",
      value: metrics.birthdaysThisMonth,
      icon: Gift,
      color: "text-pink-600",
      bg: "bg-pink-50",
    },
    {
      label: "Vencen Hoy",
      value: metrics.expiringToday,
      icon: Clock,
      color: metrics.expiringToday > 0 ? "text-red-600" : "text-gray-400",
      bg: metrics.expiringToday > 0 ? "bg-red-50" : "bg-gray-50",
    },
    {
      label: "Congelados",
      value: metrics.frozenMembers,
      icon: Clock,
      color: "text-amber-800 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white border border-black/5 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${card.bg}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#7a7f87]">
              {card.label}
            </p>
          </div>
          <p className="text-xl font-display font-bold text-[#111111]">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}

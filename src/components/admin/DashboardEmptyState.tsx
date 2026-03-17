import AdminSurface from "./AdminSurface";

interface DashboardEmptyStateProps {
  title: string;
  description: string;
}

export default function DashboardEmptyState({ title, description }: DashboardEmptyStateProps) {
  return (
    <AdminSurface inset className="border-dashed px-6 py-10 text-center shadow-none">
      <p className="text-lg font-semibold text-[#111111]">{title}</p>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#5f6368]">{description}</p>
    </AdminSurface>
  );
}

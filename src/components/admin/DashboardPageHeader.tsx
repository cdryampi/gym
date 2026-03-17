interface DashboardPageHeaderProps {
  title: string;
  description: string;
  eyebrow?: string;
}

export default function DashboardPageHeader({
  title,
  description,
  eyebrow = "Backoffice",
}: DashboardPageHeaderProps) {
  return (
    <header className="space-y-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#d71920]">{eyebrow}</p>
      <h1 className="text-3xl font-semibold tracking-tight text-[#111111] sm:text-[2.2rem]">
        {title}
      </h1>
      <p className="max-w-3xl text-sm leading-7 text-[#5f6368]">{description}</p>
    </header>
  );
}

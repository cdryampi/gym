"use client";

import {
  CalendarClock,
  ClipboardList,
  FileText,
  Globe,
  Settings2,
  ShoppingBag,
  Smartphone,
  Weight,
  Moon,
  Sun,
  Zap,
  Activity,
  ChevronRight,
  Database,
  Users,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

type NavLinkChild = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavLinkItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: NavLinkChild[];
  tag?: string;
  isHeader?: false;
};

type NavHeaderItem = {
  href: "#";
  isHeader: true;
  label: string;
};

type NavItem = NavLinkItem | NavHeaderItem;

const links: NavItem[] = [
  { href: "/dashboard", label: "COMMAND CENTER", icon: Activity },
  { isHeader: true, label: "Growth & Revenue", href: "#" },
  { href: "/dashboard/leads", label: "LEADS ENGINE", icon: Zap, tag: "Hot" },
  { href: "/dashboard/miembros", label: "MEMBER SCOUTING", icon: ClipboardList },
  { href: "/dashboard/tienda", label: "RETAIL CONSOLE", icon: ShoppingBag },
  
  { isHeader: true, label: "Core Technology", href: "#" },
  {
    href: "/dashboard/mobile",
    label: "MOBILE HUB",
    icon: Smartphone,
    tag: "Pro",
    children: [
      { href: "/dashboard/mobile", label: "ACCESS CONTROL", icon: Database },
      { href: "/dashboard/miembros", label: "MEMBER SCOUTING", icon: ClipboardList },
      { href: "/dashboard/rutinas", label: "ROUTINE DESIGNER", icon: Weight },
    ],
  },
  
  { isHeader: true, label: "Digital Presence", href: "#" },
  { href: "/dashboard/web", label: "IDENTITY STUDIO", icon: Globe },
  { href: "/dashboard/marketing", label: "CAMPAIGNS", icon: CalendarClock },
  { href: "/dashboard/cms", label: "MEDIA & LEGAL", icon: FileText },
  
  { isHeader: true, label: "System", href: "#" },
  { href: "/dashboard/info", label: "GYM PROFILE", icon: Users },
  { href: "/dashboard/advanced", label: "KERNEL ARGS", icon: Settings2 },
];

function isItemActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

const THEME_STORAGE_KEY = "nuova-forza-theme";
const themeListeners = new Set<() => void>();

function getThemeSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark";
}

function getThemeServerSnapshot() {
  return false;
}

function notifyThemeListeners() {
  themeListeners.forEach((listener) => listener());
}

function subscribeToThemePreference(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  themeListeners.add(onStoreChange);

  const handleChange = (event: StorageEvent) => {
    if (event.key === null || event.key === THEME_STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleChange);

  return () => {
    themeListeners.delete(onStoreChange);
    window.removeEventListener("storage", handleChange);
  };
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const isDarkMode = useSyncExternalStore(
    subscribeToThemePreference,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    window.localStorage.setItem(THEME_STORAGE_KEY, newMode ? "dark" : "light");
    notifyThemeListeners();
  };

  return (
    <div className="flex h-full flex-col bg-[#111111] text-white">
      {/* BRANDING AREA - ULTRA INDUSTRIAL */}
      <div className="p-8 pb-10">
        <div className="flex items-center gap-4">
          <div className="relative h-10 w-10 shrink-0 bg-white p-1.5">
             <Image 
               src="/images/logo/logo-trans.webp" 
               alt="Nuova Forza Logo" 
               fill 
               className="object-contain"
             />
          </div>
          <div>
            <h2 className="font-display text-2xl font-black uppercase tracking-tighter leading-none">
              NUOVA<span className="text-[#d71920]">FORZA</span>
            </h2>
            <p className="mt-1 text-[8px] font-black uppercase tracking-[0.4em] text-white/30">Backoffice Gym</p>
          </div>
        </div>
      </div>

      {/* NAVIGATION - SCROLLABLE */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-8" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <nav className="space-y-1">
          {links.map((link, idx) => {
            if (link.isHeader) {
              return (
                <p key={idx} className="mb-2 mt-8 px-4 text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
                  {link.label}
                </p>
              );
            }

            const Icon = link.icon;
            const hasChildren = Boolean(link.children?.length);
            
            // Un item es activo si su href coincide O si algun hijo es activo
            const isSelfActive = isItemActive(pathname, link.href);
            const isChildActive = link.children?.some(c => isItemActive(pathname, c.href));
            const isActive = isSelfActive || isChildActive;
            
            // Mostrar submenu si esta activo
            const showSubmenu = isActive;

            return (
              <div key={link.href + idx} className="space-y-1">
                <Link
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group flex items-center justify-between px-4 py-3 transition-all border-l-2",
                    isActive
                      ? "bg-white/5 border-[#d71920] text-white shadow-lg"
                      : "bg-transparent border-transparent text-white/40 hover:bg-white/[0.02] hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-[#d71920]" : "group-hover:text-white")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{link.label}</span>
                  </div>
                  {link.tag && !isActive && (
                    <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                       <div className="h-1 w-1 rounded-full bg-[#d71920] animate-pulse" />
                       <span className="text-[7px] font-black text-[#111111] uppercase tracking-tighter">{link.tag}</span>
                    </div>
                  )}
                  {hasChildren && <ChevronRight className={cn("h-3 w-3 transition-transform text-[#d71920]", showSubmenu && "rotate-90")} />}
                </Link>

                {hasChildren && showSubmenu && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-white/5 pl-2 animate-in fade-in slide-in-from-left-2 duration-300">
                    {link.children?.map((child) => {
                      const isSubActive = isItemActive(pathname, child.href);
                      const SubIcon = child.icon;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          aria-current={isSubActive ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest transition-all",
                            isSubActive 
                              ? "bg-white/5 text-white" 
                              : "text-white/30 hover:text-white"
                          )}
                        >
                          <SubIcon className={cn("h-3 w-3", isSubActive ? "text-[#d71920]" : "text-white/10")} />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* FOOTER AREA: THEME SWITCH & STATUS */}
      <div className="mt-auto border-t border-white/5 p-6 bg-black/20">
        <button 
          onClick={toggleTheme}
          className="flex w-full items-center justify-between bg-white/5 border border-white/10 px-4 py-3 transition-all hover:bg-white/10 group"
        >
          <div className="flex items-center gap-3">
            {isDarkMode ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-white/40 group-hover:text-white" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white">Dark Mode</span>
              </>
            )}
          </div>
          <div className="h-4 w-px bg-white/10" />
          <LayoutGrid className="h-3 w-3 text-white/20" />
        </button>
        
        <div className="mt-6 flex items-center justify-between px-1">
           <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[8px] font-black uppercase tracking-widest text-white/20 text-xs">System Online</p>
           </div>
           <p className="text-[8px] font-black text-white/10">V2.0.4</p>
        </div>
      </div>
    </div>
  );
}

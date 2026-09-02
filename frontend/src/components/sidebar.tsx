import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  FolderKanban,
  Users,
  Settings,
  LogOut,
  Zap,
  X,
  CreditCard,
  ListChecks,
} from "lucide-react";
import { useAuth } from "../context/use-auth";

const navSections = [
  {
    label: "منوی اصلی",
    items: [
      { to: "/", icon: LayoutDashboard, label: "داشبورد", end: true },
      { to: "/dashboard/analytics", icon: BarChart3, label: "آمار و تحلیل" },
      { to: "/dashboard/projects", icon: FolderKanban, label: "پروژه‌ها" },
    ],
  },
  {
    label: "اقساط",
    items: [
      { to: "/installments", icon: CreditCard, label: "ثبت اقساط" },
      { to: "/installments/list", icon: ListChecks, label: "لیست اقساط" },
    ],
  },
  {
    label: "مدیریت",
    items: [
      { to: "/dashboard/team", icon: Users, label: "تیم" },
      { to: "/dashboard/settings", icon: Settings, label: "تنظیمات" },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { logout } = useAuth();
  const handleLogout = async () => {
    await logout();
  };
  return (
    <>
      {/* Backdrop overlay — mobile only */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white/95 backdrop-blur-xl shadow-2xl shadow-black/10 transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] lg:translate-x-0 lg:static lg:z-auto lg:w-64 lg:bg-white/80 lg:backdrop-blur-[30px] lg:shadow-xl lg:shadow-black/4 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/25">
              <Zap className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-gray-900">
              داشبورد
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-600 active:scale-95 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-4 h-px bg-linear-to-l from-transparent via-gray-200 to-transparent shrink-0" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navSections.map((section) => (
            <div key={section.label} className="mb-5">
              <p className="mb-1.5 px-3 text-2xs font-semibold uppercase tracking-widest text-gray-400">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ to, icon: Icon, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-indigo-50 text-indigo-600 shadow-[0_1px_4px_rgba(99,102,241,0.08)]"
                          : "text-gray-500 hover:bg-black/5 hover:text-gray-800"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute -right-3 top-1/2 h-5 w-0.75 -translate-y-1/2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                        )}
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
                            isActive
                              ? "bg-indigo-500/10 text-indigo-600"
                              : "text-gray-400 group-hover:bg-black/5 group-hover:text-gray-700"
                          }`}
                        >
                          <Icon className="h-4.25 w-4.25" />
                        </span>
                        <span className="flex-1">{label}</span>
                        {isActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)]" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-100 px-3 py-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 transition-all duration-200 hover:bg-red-50/60 hover:text-red-500 active:scale-[0.98]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg">
              <LogOut className="h-4.25 w-4.25" />
            </span>
            <span>خروج از حساب</span>
          </button>
        </div>
      </aside>
    </>
  );
}

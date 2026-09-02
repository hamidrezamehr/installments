import { useState, useRef, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import Sidebar from "./sidebar";
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  User,
  LogOut,
  Settings,
} from "lucide-react";
import { useAuth } from "../context/use-auth";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileOpen]);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
  };

  const userName = user?.name || "کاربر";
  const userEmail = user?.email || "user@example.com";
  const userInitial = userName.charAt(0);

  return (
    <div dir="rtl" className="flex h-dvh overflow-hidden lg:h-dvh">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-h-0 min-w-0">
        {/* ── Desktop Header ── */}
        <header className="z-30 bg-white hidden h-16 shrink-0 items-center justify-between border-b border-black/10 px-6 lg:flex">
          {/* Right side: search */}
          <div className="relative w-80">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="جستجو..."
              dir="rtl"
              className="w-full rounded-xl border border-black/20 bg-white/40 py-2 pr-10 pl-4 text-sm text-gray-700 shadow-inner shadow-black/2 placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-indigo-400/50 focus:bg-white/60 focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>

          {/* Left side: actions + profile */}
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-all duration-200 hover:bg-white/50 hover:text-gray-600">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute left-1.5 top-1.5 h-2 w-2 rounded-full bg-red-400 shadow-sm shadow-red-400/50" />
            </button>

            <div className="mx-2 h-6 w-px bg-gray-200" />

            {/* Profile Dropdown */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className={`flex items-center gap-3 rounded-xl py-1.5 pr-1.5 pl-3 transition-all duration-200 ${
                  profileOpen ? "bg-indigo-50/60" : "hover:bg-white/40"
                }`}
              >
                <div className="text-left">
                  <p className="text-[13px] font-semibold text-gray-800">
                    {userName}
                  </p>
                  <p className="text-[11px] text-gray-400">{userEmail}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-md shadow-indigo-500/20">
                  {userInitial}
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown menu */}
              <div
                className={`absolute left-0 top-full mt-2 w-64 origin-top-left rounded-2xl border border-black/10 bg-white/95 p-2 shadow-xl shadow-black/8 backdrop-blur-xl transition-all duration-200 ${
                  profileOpen
                    ? "scale-100 opacity-100"
                    : "pointer-events-none scale-95 opacity-0"
                }`}
              >
                {/* User info */}
                <div className="flex items-center gap-3 rounded-xl px-3 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-500/20">
                    {userInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {userName}
                    </p>
                    <p
                      dir="ltr"
                      className="truncate text-xs text-gray-500 text-left"
                    >
                      {userEmail}
                    </p>
                  </div>
                </div>

                <div className="mx-3 my-1 h-px bg-linear-to-l from-transparent via-gray-200 to-transparent" />

                {/* Links */}
                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-indigo-50/60 hover:text-indigo-600"
                >
                  <User className="h-4 w-4" />
                  پروفایل
                </Link>

                <Link
                  to="/dashboard/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-indigo-50/60 hover:text-indigo-600"
                >
                  <Settings className="h-4 w-4" />
                  تنظیمات
                </Link>

                <div className="mx-3 my-1 h-px bg-linear-to-l from-transparent via-gray-200 to-transparent" />

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50/60"
                >
                  <LogOut className="h-4 w-4" />
                  خروج از حساب
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ── Mobile Header ── */}
        <header
          className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-black/10 px-4 lg:hidden"
          style={{
            background: "rgba(255, 255, 255, 0.55)",
            backdropFilter: "blur(16px) saturate(180%)",
            WebkitBackdropFilter: "blur(16px) saturate(180%)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-all duration-200 hover:bg-white/50 hover:text-gray-700 active:scale-95"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 text-2xs font-bold text-white shadow-md shadow-indigo-500/20">
              ک
            </div>
            <span className="text-sm font-bold text-gray-800">داشبورد</span>
          </div>

          <button className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition-all duration-200 hover:bg-white/50 hover:text-gray-600 active:scale-95">
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute left-1.5 top-1.5 h-2 w-2 rounded-full bg-red-400 shadow-sm shadow-red-400/50" />
          </button>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-y-auto min-h-0 p-2 sm:p-3 lg:p-4">
          <div className="rounded-xl max-h-[50vh] space-y-2 overflow-y-auto border border-black/10 bg-white/30 shadow-sm backdrop-blur-sm min-h-full p-4 sm:p-5 lg:p-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

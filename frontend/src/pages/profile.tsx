import { useAuth } from "../context/use-auth";
import { LogOut, User, Mail } from "lucide-react";

function Profile() {
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Profile Card */}
      <div className="rounded-2xl border border-black/10 bg-white/50 p-6 shadow-sm backdrop-blur-sm sm:p-8">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 text-2xl font-bold text-white shadow-lg shadow-indigo-500/25 sm:h-20 sm:w-20 sm:text-3xl">
            {user.name?.charAt(0) || "ک"}
          </div>
          <div className="text-center sm:text-right">
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              {user.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">پروفایل کاربری</p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-gray-50/80 px-4 py-3">
            <User className="h-4.5 w-4.5 shrink-0 text-gray-400" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-400">نام</p>
              <p className="truncate text-sm font-medium text-gray-800">
                {user.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-gray-50/80 px-4 py-3">
            <Mail className="h-4.5 w-4.5 shrink-0 text-gray-400" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-400">ایمیل</p>
              <p
                dir="ltr"
                className="truncate text-sm font-medium text-gray-800 text-left"
              >
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200/60 bg-red-50/60 px-4 py-3 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-100/80 hover:border-red-300 active:scale-[0.98]"
      >
        <LogOut className="h-4 w-4" />
        خروج از حساب
      </button>
    </div>
  );
}

export default Profile;

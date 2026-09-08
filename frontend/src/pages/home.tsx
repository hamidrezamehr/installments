import { Link } from "react-router-dom";
import {
  CreditCard,
  Landmark,
  ArrowLeft,
  Plus,
  Receipt,
  Wallet,
} from "lucide-react";
import { useAuth } from "../context/use-auth";

const quickActions = [
  {
    to: "/installments/new/bank-facility",
    icon: Landmark,
    title: "ثبت تسهیلات بانکی",
    description: "اطلاعات وام بانکی خود را وارد کنید",
  },
  {
    to: "/installments",
    icon: Receipt,
    title: "مشاهده اقساط",
    description: "لیست اقساط ثبت‌شده را ببینید",
  },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div dir="rtl" className="mx-auto max-w-4xl space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {user ? `سلام ${user.name} 👋` : "داشبورد"}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          اقساط و پرداخت‌های خود را از اینجا مدیریت کنید
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {quickActions.map(({ to, icon: Icon, title, description }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-2xl border border-black/10 bg-white p-6 text-right shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-black/5"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-md">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="mb-1 text-[15px] font-bold text-gray-900">
              {title}
            </h3>
            <p className="text-xs leading-relaxed text-gray-500">
              {description}
            </p>
            <span className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-500 opacity-0 transition-all duration-300 group-hover:opacity-100">
              ادامه
              <ArrowLeft className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>

      {/* Empty state hint */}
      <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/50 p-4">
        <p className="flex items-center gap-2 text-xs leading-relaxed text-indigo-700">
          <Wallet className="h-4 w-4 shrink-0" />
          برای شروع، یک تسهیلات بانکی ثبت کنید تا اقساطتان را اینجا ببینید.
          <Plus className="h-3.5 w-3.5 shrink-0" />
          <Link
            to="/installments/new/bank-facility"
            className="font-semibold underline-offset-2 hover:underline"
          >
            ثبت تسهیلات
          </Link>
        </p>
      </div>

      {/* Installments entry */}
      <Link
        to="/installments"
        className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-900">
            مدیریت اقساط
          </span>
        </div>
        <ArrowLeft className="h-4 w-4 text-gray-400" />
      </Link>
    </div>
  );
}

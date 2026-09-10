import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  TrendingUp,
  Landmark,
  CalendarClock,
  Building2,
  Plus,
  RefreshCw,
  Inbox,
  ListChecks,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toJalaali } from "jalaali-js";
import { getInstallments } from "../api/installments";
import { extractApiErrorMessage } from "../api";
import type { BankFacility, InstallmentRecord } from "../types/installment";

/* ── Helpers (mirror installment-list.tsx conventions) ───── */

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
}

function formatJalaliDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00"));
    if (isNaN(d.getTime())) return dateStr;
    const j = toJalaali(d);
    return `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")}`;
  } catch {
    return dateStr;
  }
}

/** Parse a YYYY-MM-DD string as a local date to avoid timezone shifts. */
function parseLocalDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

/** Whole months between two dates. */
function monthsBetween(from: Date, to: Date): number {
  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth())
  );
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
}

interface FacilityProgress {
  record: InstallmentRecord;
  data: BankFacility;
  paid: number;
  total: number;
  remaining: number;
  progress: number;
  remainingAmount: number;
  paidAmount: number;
  nextPaymentDate: Date | null;
}

/* ── Component ───────────────────────────────────────────── */

export default function Home() {
  const navigate = useNavigate();

  const [records, setRecords] = useState<InstallmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await getInstallments();
      setRecords(Array.isArray(data) ? data : []);
      setError("");
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, "خطا در دریافت اطلاعات اقساط"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    void load();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch; state updates happen after the async call resolves
    void load();
  }, [load]);

  const facilities = useMemo<FacilityProgress[]>(() => {
    return records
      .filter((r) => r.category === "bank_facility" && r.data)
      .map((record) => {
        const data = record.data as BankFacility;
        const total = Math.max(0, data.total_installments ?? 0);
        const perInstallment = data.installment_amount ?? 0;

        // Installments are monthly starting from start_date; the number of
        // installments paid so far is estimated from elapsed time.
        const start = parseLocalDate(data.start_date);
        const paid =
          start && total > 0
            ? Math.min(Math.max(monthsBetween(start, new Date()), 0), total)
            : 0;
        const remaining = Math.max(0, total - paid);
        const progress = total > 0 ? Math.min(paid / total, 1) : 0;
        const remainingAmount = remaining * perInstallment;
        const paidAmount = paid * perInstallment;
        const nextPaymentDate =
          start && remaining > 0 ? addMonths(start, paid) : null;

        return {
          record,
          data,
          paid,
          total,
          remaining,
          progress,
          remainingAmount,
          paidAmount,
          nextPaymentDate,
        };
      })
      .sort((a, b) => b.progress - a.progress);
  }, [records]);

  const stats = useMemo(() => {
    const totalRemaining = facilities.reduce(
      (sum, f) => sum + f.remainingAmount,
      0,
    );
    const totalPaid = facilities.reduce((sum, f) => sum + f.paidAmount, 0);
    const activeCount = facilities.filter((f) => f.remaining > 0).length;
    const totalInstallments = facilities.reduce((sum, f) => sum + f.total, 0);
    const monthlyBurden = facilities
      .filter((f) => f.remaining > 0)
      .reduce((sum, f) => sum + (f.data.installment_amount ?? 0), 0);
    return {
      totalRemaining,
      totalPaid,
      activeCount,
      totalInstallments,
      monthlyBurden,
    };
  }, [facilities]);

  const upcoming = useMemo(() => {
    return facilities
      .filter((f) => f.nextPaymentDate)
      .sort(
        (a, b) =>
          (a.nextPaymentDate?.getTime() ?? 0) -
          (b.nextPaymentDate?.getTime() ?? 0),
      )
      .slice(0, 4);
  }, [facilities]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  /* ── Error ── */
  if (error && facilities.length === 0) {
    return (
      <div dir="rtl" className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-red-200/60 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
          <AlertCircle className="h-7 w-7 text-red-500" />
        </div>
        <p className="text-sm font-medium text-red-600">{error}</p>
        <button
          onClick={() => void load()}
          className="mt-5 flex items-center gap-2 rounded-xl bg-linear-to-l from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all hover:from-indigo-600 hover:to-violet-700"
        >
          <RefreshCw className="h-4 w-4" />
          تلاش مجدد
        </button>
      </div>
    );
  }

  /* ── Empty ── */
  if (facilities.length === 0) {
    return (
      <div dir="rtl" className="mx-auto max-w-lg">
        <div className="flex flex-col items-center rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
            <Inbox className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            هنوز قسطی ثبت نشده است
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            برای شروع، اطلاعات تسهیلات بانکی خود را ثبت کنید تا وضعیت
            پرداخت‌هایتان را اینجا ببینید.
          </p>
          <button
            onClick={() => navigate("/installments/new/bank-facility")}
            className="mt-6 flex items-center gap-2 rounded-xl bg-linear-to-l from-indigo-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-600 hover:to-violet-700 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="h-4 w-4" />
            ثبت تسهیلات بانکی
          </button>
        </div>
      </div>
    );
  }

  /* ── Dashboard ── */
  return (
    <div dir="rtl" className="mx-auto max-w-6xl space-y-4">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            داشبورد
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            خلاصه‌ای از اقساط و پرداخت‌های شما
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-gray-600 shadow-sm transition-all duration-200 hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
          بروزرسانی
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Remaining balance */}
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">
              مانده کل اقساط
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25">
              <Wallet className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-3 text-lg font-bold text-gray-900">
            {formatCurrency(stats.totalRemaining)}
          </p>
          <p className="mt-1 text-2xs text-gray-400">
            از {facilities.length.toLocaleString("fa-IR")} تسهیلات ثبت‌شده
          </p>
        </div>

        {/* Paid so far */}
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">
              مجموع پرداخت‌شده
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-3 text-lg font-bold text-gray-900">
            {formatCurrency(stats.totalPaid)}
          </p>
          <p className="mt-1 text-2xs text-gray-400">
            بر اساس اقساط سپری‌شده
          </p>
        </div>

        {/* Active facilities */}
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">
              تسهیلات فعال
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25">
              <Landmark className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-3 text-lg font-bold text-gray-900">
            {stats.activeCount.toLocaleString("fa-IR")}{" "}
            <span className="text-sm font-medium text-gray-400">
              مورد در جریان
            </span>
          </p>
          <p className="mt-1 text-2xs text-gray-400">
            مجموع {stats.totalInstallments.toLocaleString("fa-IR")} قسط
          </p>
        </div>

        {/* Monthly burden */}
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">
              پرداخت ماهانه
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25">
              <CalendarClock className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-3 text-lg font-bold text-gray-900">
            {formatCurrency(stats.monthlyBurden)}
          </p>
          <p className="mt-1 text-2xs text-gray-400">جمع اقساط ماه جاری</p>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Facility progress */}
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">وضعیت تسهیلات</h2>
            <button
              onClick={() => navigate("/installments/list")}
              className="text-xs font-semibold text-indigo-500 transition-colors hover:text-indigo-600"
            >
              مشاهده همه
            </button>
          </div>
          <div className="space-y-4">
            {facilities.slice(0, 4).map(({ record, data, paid, total, remaining, progress, remainingAmount }) => (
              <div
                key={record.id}
                onClick={() => navigate(`/installments/${record.id}`)}
                className="cursor-pointer rounded-xl border border-black/10 bg-gray-50/60 p-4 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm"
              >
                <div className="mb-2.5 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">
                        {data.title || record.title}
                      </p>
                      <p className="truncate text-2xs text-gray-400">
                        {data.bank_name}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-left">
                    <p className="text-2xs text-gray-400">مانده</p>
                    <p className="text-xs font-bold text-gray-800">
                      {formatCurrency(remainingAmount)}
                    </p>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-200/80">
                  <div
                    className="h-full rounded-full bg-linear-to-l from-indigo-500 to-violet-600 transition-all duration-500"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-2xs text-gray-500">
                  {paid.toLocaleString("fa-IR")} از{" "}
                  {total.toLocaleString("fa-IR")} قسط پرداخت شده
                  {remaining > 0
                    ? ` — ${remaining.toLocaleString("fa-IR")} قسط باقی‌مانده`
                    : " — تسویه شده ✓"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Upcoming payments */}
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-gray-900">
              اقساط پیش‌رو
            </h2>
            {upcoming.length === 0 ? (
              <p className="rounded-xl bg-gray-50/80 px-4 py-3 text-xs leading-relaxed text-gray-500">
                قسط پیش‌رویی باقی نمانده است. همه تسهیلات شما تسویه شده‌اند.
              </p>
            ) : (
              <div className="space-y-3">
                {upcoming.map(({ record, data, nextPaymentDate, paid, total }) => (
                  <div
                    key={record.id}
                    onClick={() => navigate(`/installments/${record.id}`)}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-black/10 bg-gray-50/60 px-4 py-3 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                        <CalendarClock className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-gray-900">
                          {data.title || record.title}
                        </p>
                        <p className="text-2xs text-gray-400">
                          قسط {(paid + 1).toLocaleString("fa-IR")} از{" "}
                          {total.toLocaleString("fa-IR")}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-2xs font-semibold text-gray-600">
                      {nextPaymentDate
                        ? formatJalaliDate(
                            `${nextPaymentDate.getFullYear()}-${String(nextPaymentDate.getMonth() + 1).padStart(2, "0")}-${String(nextPaymentDate.getDate()).padStart(2, "0")}`,
                          )
                        : "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-gray-900">
              دسترسی سریع
            </h2>
            <div className="space-y-2.5">
              <button
                onClick={() => navigate("/installments/new/bank-facility")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-l from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-600 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-500/30"
              >
                <Plus className="h-4 w-4" />
                ثبت تسهیلات جدید
              </button>
              <button
                onClick={() => navigate("/installments/list")}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-gray-50"
              >
                <ListChecks className="h-4 w-4" />
                مشاهده لیست اقساط
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  ListChecks,
  Landmark,
  CreditCard,
  Calendar,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Inbox,
  TrendingUp,
  ChevronLeft,
} from "lucide-react";
import { getInstallments } from "../services/installment-api";
import type { InstallmentRecord } from "../types/installment";
import { formatCurrency } from "../lib/currency";
import { formatJalaliDate, getTodayJalali } from "../lib/jalali";
import { buildSchedule } from "../lib/schedule";
import { useAuth } from "../context/use-auth";
import { getApiErrorMessage } from "../lib/api-errors"

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [records, setRecords] = useState<InstallmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getInstallments();
        if (!cancelled) setRecords(data);
      } catch (err: unknown) {
        if (cancelled) return;
        setError(getApiErrorMessage(err, "خطا در دریافت اطلاعات"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Compute global stats from all records
  const stats = useMemo(() => {
    let totalInstallments = 0;
    let totalPaid = 0;
    let totalOverdue = 0;
    let totalAmount = 0;
    let paidAmount = 0;

    for (const record of records) {
      if (!record.data) continue;
      const schedule = buildSchedule(
        record.data.start_date,
        record.data.total_installments,
        record.payments || [],
      );
      totalInstallments += schedule.length;
      totalPaid += schedule.filter((s) => s.paid).length;
      totalOverdue += schedule.filter((s) => s.due && !s.paid).length;
      totalAmount += record.data.total_loan_amount || 0;
      paidAmount +=
        (record.payments?.length || 0) * (record.data.installment_amount || 0);
    }

    return {
      facilityCount: records.length,
      totalInstallments,
      paid: totalPaid,
      overdue: totalOverdue,
      remaining: totalInstallments - totalPaid,
      totalAmount,
      paidAmount,
    };
  }, [records]);

  // Recent records (last 5)
  const recentRecords = useMemo(() => {
    return [...records]
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [records]);

  // Overdue facilities (for alert)
  const overdueFacilities = useMemo(() => {
    return records.filter((record) => {
      if (!record.data) return false;
      const schedule = buildSchedule(
        record.data.start_date,
        record.data.total_installments,
        record.payments || [],
      );
      return schedule.some((s) => s.due && !s.paid);
    });
  }, [records]);

  const userName = user?.name || "کاربر";
  const todayJalali = getTodayJalali();

  if (loading) {
    return (
      <div dir="rtl" className="mx-auto max-w-4xl space-y-6">
        {/* Welcome skeleton */}
        <div className="space-y-2">
          <div className="h-7 w-64 animate-pulse rounded-lg bg-gray-200/60" />
          <div className="h-4 w-80 animate-pulse rounded-lg bg-gray-200/60" />
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-gray-50 p-4 text-center">
              <div className="mx-auto h-3 w-16 animate-pulse rounded bg-gray-200/60" />
              <div className="mx-auto mt-2 h-7 w-10 animate-pulse rounded bg-gray-200/60" />
            </div>
          ))}
        </div>
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-28 animate-pulse rounded-2xl bg-gray-200/40" />
          <div className="h-28 animate-pulse rounded-2xl bg-gray-200/40" />
        </div>
        {/* Recent skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl bg-gray-200/40"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="mx-auto max-w-4xl space-y-6">
      {/* ── Welcome Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            سلام {userName} 👋
          </h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-500">
            <Calendar className="h-3.5 w-3.5" />
            {todayJalali}
          </p>
        </div>
        <button
          onClick={() => navigate("/installments")}
          className="flex items-center gap-1.5 rounded-xl bg-linear-to-l from-indigo-500 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-600 hover:to-violet-700 hover:-translate-y-0.5 active:translate-y-0 sm:text-sm sm:px-5 sm:py-2.5"
        >
          <Plus className="h-4 w-4" />
          تسهیلات جدید
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200/60 bg-red-50/70 px-4 py-3 text-sm font-medium text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Overdue Alert ── */}
      {stats.overdue > 0 && (
        <button
          onClick={() => {
            // Navigate to the first overdue facility
            if (overdueFacilities.length > 0) {
              navigate(`/installments/${overdueFacilities[0].id}`);
            }
          }}
          className="w-full rounded-2xl border border-amber-300/60 bg-linear-to-l from-amber-50 to-orange-50 p-4 text-right transition-all duration-200 hover:shadow-md hover:shadow-amber-100"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800">
                {stats.overdue} قسط سررسید شده
              </p>
              <p className="mt-0.5 text-xs text-amber-600">
                قسط‌های معوق خود را بررسی و پرداخت کنید
              </p>
            </div>
            <ChevronLeft className="h-5 w-5 text-amber-400" />
          </div>
        </button>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
              <Landmark className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="text-[11px] font-semibold text-gray-500">
              تسهیلات
            </p>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {stats.facilityCount}
          </p>
          <p className="mt-0.5 text-[10px] text-gray-400">
            {stats.totalInstallments > 0
              ? `${stats.totalInstallments} قسط فعال`
              : "بدون تسهیلات"}
          </p>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-[11px] font-semibold text-emerald-600">
              پرداخت شده
            </p>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {stats.paid}
          </p>
          <p className="mt-0.5 text-[10px] text-gray-400">
            از {stats.totalInstallments} قسط
          </p>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-[11px] font-semibold text-amber-600">
              سررسید شده
            </p>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {stats.overdue}
          </p>
          <p className="mt-0.5 text-[10px] text-gray-400">
            {stats.overdue > 0 ? "نیاز به پرداخت" : "همه به‌روز"}
          </p>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
              <TrendingUp className="h-4 w-4 text-violet-500" />
            </div>
            <p className="text-[11px] font-semibold text-violet-600">
              باقی‌مانده
            </p>
          </div>
          <p className="mt-2 text-2xl font-bold text-violet-600">
            {stats.remaining}
          </p>
          <p className="mt-0.5 text-[10px] text-gray-400">
            قسط پرداخت نشده
          </p>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          onClick={() => navigate("/installments")}
          className="group relative overflow-hidden rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 p-5 text-right text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/25"
        >
          <div className="absolute -left-6 -bottom-6 h-20 w-20 rounded-full bg-white/10 blur-xl transition-transform duration-300 group-hover:scale-150" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold">ثبت تسهیلات جدید</h3>
              <p className="mt-0.5 text-xs text-indigo-200">
                اطلاعات وام یا تسهیلات بانکی را ثبت کنید
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate("/installments/list")}
          className="group relative overflow-hidden rounded-2xl border border-black/10 bg-white p-5 text-right shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/5"
        >
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
              <ListChecks className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">
                لیست اقساط
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                تمام تسهیلات ثبت‌شده را مشاهده کنید
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* ── Recent Installments ── */}
      {recentRecords.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">
              آخرین تسهیلات
            </h2>
            <button
              onClick={() => navigate("/installments/list")}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-500 transition-colors hover:text-indigo-600"
            >
              مشاهده همه
              <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
            </button>
          </div>
          <div className="space-y-2.5">
            {recentRecords.map((record) => {
              const schedule = buildSchedule(
                record.data?.start_date || "",
                record.data?.total_installments || 0,
                record.payments || [],
              );
              const paid = schedule.filter((s) => s.paid).length;
              const total = schedule.length;
              const overdue = schedule.filter((s) => s.due && !s.paid).length;
              const progress = total > 0 ? (paid / total) * 100 : 0;

              return (
                <button
                  key={record.id}
                  onClick={() => navigate(`/installments/${record.id}`)}
                  className="group w-full rounded-2xl border border-black/10 bg-white p-4 text-right shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-black/5 hover:border-indigo-200/60"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-bold text-gray-900">
                          {record.title}
                        </h3>
                        {overdue > 0 && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            {overdue} معوق
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Landmark className="h-3 w-3" />
                          {record.data?.bank_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {formatCurrency(
                            record.data?.installment_amount || 0,
                          )}
                          ×{record.data?.total_installments} قسط
                        </span>
                        {record.data?.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatJalaliDate(record.data.start_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {/* Progress bar */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700">
                          {paid}/{total}
                        </span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>
                      </div>
                      {record.created_at && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Clock className="h-2.5 w-2.5" />
                          {formatJalaliDate(record.created_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {records.length === 0 && !error && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 px-6 py-16 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50">
            <Inbox className="h-10 w-10 text-indigo-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            اولین تسهیلات خود را ثبت کنید
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
            با ثبت اطلاعات تسهیلات بانکی، می‌توانید وضعیت پرداخت هر قسط را
            پیگیری کنید و هیچ سررسیدی را از دست ندهید.
          </p>

          {/* Steps */}
          <div className="mt-8 grid w-full max-w-sm grid-cols-1 gap-3">
            <div className="flex items-center gap-3 rounded-xl bg-white p-3 text-right shadow-sm border border-black/5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-600">
                ۱
              </div>
              <p className="text-xs font-medium text-gray-700">
                اطلاعات تسهیلات را وارد کنید
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white p-3 text-right shadow-sm border border-black/5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-600">
                ۲
              </div>
              <p className="text-xs font-medium text-gray-700">
                برنامه اقساط به‌صورت خودکار ساخته می‌شود
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white p-3 text-right shadow-sm border border-black/5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-600">
                ۳
              </div>
              <p className="text-xs font-medium text-gray-700">
                پرداخت هر قسط را علامت‌گذاری کنید
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/installments")}
            className="mt-8 flex items-center gap-2 rounded-xl bg-linear-to-l from-indigo-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-600 hover:to-violet-700 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
          >
            <Plus className="h-4 w-4" />
            ثبت اولین تسهیلات
          </button>
        </div>
      )}

      {/* ── Tips ── */}
      {records.length > 0 && stats.overdue === 0 && (
        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-4">
          <p className="text-xs leading-relaxed text-emerald-700">
            <strong>عالی!</strong> همه اقساط شما به‌روز است. روی هر تسهیلات
            کلیک کنید تا وضعیت پرداخت آن را مشاهده و مدیریت کنید.
          </p>
        </div>
      )}
    </div>
  );
}

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
  AlertCircle,
  Inbox,
} from "lucide-react";
import { getInstallments } from "../api/installments";
import type { InstallmentRecord } from "../types/installment";
import { formatCurrency } from "../lib/currency";
import { formatJalaliDate } from "../lib/jalali";
import { buildSchedule } from "../lib/schedule";
import { useAuth } from "../context/use-auth";

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
        let msg = "خطا در دریافت اطلاعات";
        if (
          typeof err === "object" &&
          err !== null &&
          "isAxiosError" in err &&
          typeof (err as { isAxiosError: Function }).isAxiosError === "function"
        ) {
          const axiosErr = err as {
            response?: { data?: { message?: string }; statusText?: string };
          };
          msg = axiosErr.response?.data?.message || axiosErr.response?.statusText || msg;
        }
        setError(msg);
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
    }

    return {
      facilityCount: records.length,
      totalInstallments,
      paid: totalPaid,
      overdue: totalOverdue,
      remaining: totalInstallments - totalPaid,
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

  const userName = user?.name || "کاربر";

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
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-200/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="mx-auto max-w-4xl space-y-6">
      {/* ── Welcome Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          سلام {userName} 👋
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">
          مدیریت اقساط و تسهیلات بانکی شما
        </p>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200/60 bg-red-50/70 px-4 py-3 text-sm font-medium text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 text-center shadow-sm border border-black/5">
          <div className="flex items-center justify-center gap-1.5">
            <Landmark className="h-3.5 w-3.5 text-indigo-400" />
            <p className="text-[11px] font-semibold text-gray-500">
              تسهیلات
            </p>
          </div>
          <p className="mt-1.5 text-2xl font-bold text-gray-900">
            {stats.facilityCount}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-sm border border-black/5">
          <div className="flex items-center justify-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-indigo-400" />
            <p className="text-[11px] font-semibold text-gray-500">
              کل اقساط
            </p>
          </div>
          <p className="mt-1.5 text-2xl font-bold text-gray-900">
            {stats.totalInstallments}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-sm border border-black/5">
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <p className="text-[11px] font-semibold text-emerald-600">
              پرداخت شده
            </p>
          </div>
          <p className="mt-1.5 text-2xl font-bold text-emerald-600">
            {stats.paid}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-sm border border-black/5">
          <div className="flex items-center justify-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
            <p className="text-[11px] font-semibold text-amber-600">
              سررسید شده
            </p>
          </div>
          <p className="mt-1.5 text-2xl font-bold text-amber-600">
            {stats.overdue}
          </p>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          onClick={() => navigate("/installments")}
          className="group relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-linear-to-br from-indigo-500 to-violet-600 p-5 text-right text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/25"
        >
          <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-white/10 blur-xl transition-transform duration-300 group-hover:scale-150" />
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
          <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-indigo-100/50 blur-xl transition-transform duration-300 group-hover:scale-150" />
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
          <div className="space-y-3">
            {recentRecords.map((record) => {
              const schedule = buildSchedule(
                record.data?.start_date || "",
                record.data?.total_installments || 0,
                record.payments || [],
              );
              const paid = schedule.filter((s) => s.paid).length;
              const total = schedule.length;

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
                      <h3 className="text-[15px] font-bold text-gray-900">
                        {record.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
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
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {/* Progress bar */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700">
                          {paid}/{total}
                        </span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{
                              width: total > 0 ? `${(paid / total) * 100}%` : "0%",
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
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 px-6 py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
            <Inbox className="h-8 w-8 text-indigo-300" />
          </div>
          <h3 className="text-base font-bold text-gray-900">
            هنوز تسهیلاتی ثبت نشده
          </h3>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-gray-500">
            برای شروع مدیریت اقساط، اولین تسهیلات بانکی خود را ثبت کنید. با
            ثبت تسهیلات می‌توانید وضعیت پرداخت هر قسط را پیگیری کنید.
          </p>
          <button
            onClick={() => navigate("/installments")}
            className="mt-6 flex items-center gap-2 rounded-xl bg-linear-to-l from-indigo-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-600 hover:to-violet-700 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
          >
            <Plus className="h-4 w-4" />
            ثبت اولین تسهیلات
          </button>
        </div>
      )}

      {/* ── Tips ── */}
      {records.length > 0 && (
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-4">
          <p className="text-xs leading-relaxed text-amber-700">
            <strong>نکته:</strong> روی هر قسط در صفحه جزئیات کلیک کنید تا
            وضعیت پرداخت آن را به‌روزرسانی کنید. قسط‌های سررسید شده با رنگ
            مشخصی نمایش داده می‌شوند.
          </p>
        </div>
      )}
    </div>
  );
}

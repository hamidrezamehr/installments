import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  ArrowRight,
  Pencil,
  Trash2,
  Landmark,
  CreditCard,
  Calendar,
  Banknote,
  Hash,
  FileText,
  Clock,
  Loader2,
  AlertCircle,
  StickyNote,
  CheckCircle2,
  CircleDot,
  Circle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js";
import type { InstallmentRecord, InstallmentPayment } from "../types/installment";
import { getInstallment, deleteInstallment, storePayment, deletePayment } from "../api/installments";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_OPTIONS } from "../types/installment";
import ConfirmDialog from "../components/confirm-dialog";
import JalaliDatePicker from "../components/jalali-date-picker";
import CustomSelect from "../components/custom-select";

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

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}

/* ── Payment schedule helpers ──────────────────────────────── */

interface ScheduleItem {
  index: number;
  dueDateJalali: string;   // "1405/01/15"
  dueDateGregorian: string; // "2026-04-04"
  due: boolean;            // due date has arrived
  paid: boolean;           // actually paid (from DB)
  payment?: InstallmentPayment; // payment details if paid
}

/** Convert Gregorian YYYY-MM-DD to Jalali {jy,jm,jd} */
function isoToJalali(iso: string): { jy: number; jm: number; jd: number } | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  return toJalaali(d);
}

/** Add N months to a Jalali date, clamping day to max valid day */
function addJalaliMonths(
  jy: number, jm: number, jd: number, months: number,
): { jy: number; jm: number; jd: number } {
  const totalMonths = (jy * 12 + (jm - 1)) + months;
  const newJy = Math.floor(totalMonths / 12);
  const newJm = (totalMonths % 12) + 1;
  const maxDay = jalaaliMonthLength(newJy, newJm);
  const newJd = jd > maxDay ? maxDay : jd;
  return { jy: newJy, jm: newJm, jd: newJd };
}

/** Build payment schedule from installment data + DB payments */
function buildSchedule(
  startDate: string,
  totalInstallments: number,
  payments: InstallmentPayment[],
): ScheduleItem[] {
  const jalaliStart = isoToJalali(startDate);
  if (!jalaliStart) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Create a map of installment_number → payment for quick lookup
  const paymentMap = new Map<number, InstallmentPayment>();
  payments.forEach((p) => paymentMap.set(p.installment_number, p));

  const schedule: ScheduleItem[] = [];
  for (let i = 0; i < totalInstallments; i++) {
    const due = addJalaliMonths(jalaliStart.jy, jalaliStart.jm, jalaliStart.jd, i);
    const g = toGregorian(due.jy, due.jm, due.jd);
    const dueIso = `${String(g.gy).padStart(4, "0")}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;
    const dueDate = new Date(dueIso + "T00:00:00");
    const isDue = today >= dueDate;
    const installmentNumber = i + 1;

    schedule.push({
      index: installmentNumber,
      dueDateJalali: `${due.jy}/${String(due.jm).padStart(2, "0")}/${String(due.jd).padStart(2, "0")}`,
      dueDateGregorian: dueIso,
      due: isDue,
      paid: paymentMap.has(installmentNumber),
      payment: paymentMap.get(installmentNumber),
    });
  }
  return schedule;
}

export default function InstallmentDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [record, setRecord] = useState<InstallmentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Delete dialog state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Payment state: payments array from DB
  const [payments, setPayments] = useState<InstallmentPayment[]>([]);

  // Payment form state
  const [paymentFormOpen, setPaymentFormOpen] = useState<number | null>(null); // installment_number or null
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Accordion state: expanded installment number or null
  const [expandedAccordion, setExpandedAccordion] = useState<number | null>(null);

  // Unpay confirmation dialog
  const [unpayConfirmOpen, setUnpayConfirmOpen] = useState<number | null>(null);
  const [unpaying, setUnpaying] = useState<number | null>(null);

  // Build schedule from installment data + DB payment state
  const data = record?.data;
  const schedule = useMemo(
    () => buildSchedule(data?.start_date ?? "", data?.total_installments ?? 0, payments),
    [data?.start_date, data?.total_installments, payments],
  );

  // Summary counts (overdue = due AND not paid)
  const totalCount = schedule.length;
  const dueCount = schedule.filter((s) => s.due && !s.paid).length;
  const paidCount = schedule.filter((s) => s.paid).length;
  const remainingCount = totalCount - paidCount;

  // Store payment via API
  const handleStorePayment = useCallback(async (installmentNumber: number) => {
    if (!record?.id || submittingPayment) return;

    if (!paymentMethod) {
      setError("لطفاً نحوه پرداخت را انتخاب کنید");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!paymentDate) {
      setError("لطفاً تاریخ پرداخت را وارد کنید");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setSubmittingPayment(true);

    try {
      const result = await storePayment(
        record.id,
        installmentNumber,
        paymentMethod,
        paymentDate,
        paymentNote,
      );

      // Add the new payment to local state
      if (result.payment) {
        setPayments((prev) => [...prev, result.payment]);
      }

      // Close form and reset
      setPaymentFormOpen(null);
      setPaymentMethod("");
      setPaymentDate("");
      setPaymentNote("");
    } catch (err: unknown) {
      let message = "خطا در ثبت پرداخت";
      if (axios.isAxiosError(err)) {
        const respData = err.response?.data;
        if (respData?.message) {
          message = respData.message;
        }
      }
      setError(message);
      setTimeout(() => setError(""), 3000);
    } finally {
      setSubmittingPayment(false);
    }
  }, [record?.id, paymentMethod, paymentDate, paymentNote, submittingPayment]);

  // Delete payment via API (unpay)
  const handleDeletePayment = useCallback(async (installmentNumber: number) => {
    if (!record?.id || unpaying !== null) return;

    setUnpaying(installmentNumber);

    try {
      await deletePayment(record.id, installmentNumber);

      // Remove payment from local state
      setPayments((prev) => prev.filter((p) => p.installment_number !== installmentNumber));

      // Close accordion if it was open
      if (expandedAccordion === installmentNumber) {
        setExpandedAccordion(null);
      }
    } catch (err: unknown) {
      let message = "خطا در لغو پرداخت";
      if (axios.isAxiosError(err)) {
        const respData = err.response?.data;
        if (respData?.message) {
          message = respData.message;
        }
      }
      setError(message);
      setTimeout(() => setError(""), 3000);
    } finally {
      setUnpaying(null);
      setUnpayConfirmOpen(null);
    }
  }, [record?.id, expandedAccordion, unpaying]);

  // Load installment + payments from API
  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      try {
        const data = await getInstallment(Number(id));
        if (!cancelled) {
          setRecord(data);

          // Initialize payments from DB
          if (data.payments) {
            setPayments(data.payments);
          }
        }
      } catch (err: unknown) {
        if (cancelled) return;

        let message = "خطا در دریافت اطلاعات قسط";

        if (axios.isAxiosError(err)) {
          const respData = err.response?.data;
          if (respData?.message) {
            message = respData.message;
            if (respData.detail) message += ` (${respData.detail})`;
          } else if (err.response?.status === 404) {
            message = "قسط مورد نظر یافت نشد";
          } else if (err.response?.status === 401) {
            message = "احراز هویت ناموفق. لطفاً دوباره وارد شوید.";
          } else if (err.response?.statusText) {
            message = `${err.response.status} - ${err.response.statusText}`;
          }
        } else if (err instanceof Error) {
          message = err.message;
        }

        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleDeleteConfirm() {
    if (!record?.id) return;
    setDeleting(true);
    try {
      await deleteInstallment(record.id);
      navigate("/installments/list");
    } catch (err: unknown) {
      let message = "خطا در حذف قسط";
      if (axios.isAxiosError(err)) {
        const respData = err.response?.data;
        if (respData?.message) {
          message = respData.message;
          if (respData.detail) message += ` (${respData.detail})`;
        } else if (err.response?.statusText) {
          message = `${err.response.status} - ${err.response.statusText}`;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setDeleting(false);
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  // Error
  if (error && !record) {
    return (
      <div dir="rtl" className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate("/installments/list")}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            جزئیات قسط
          </h1>
        </div>
        <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-2xl border border-red-200/60 bg-red-50/50">
          <AlertCircle className="mb-3 h-10 w-10 text-red-400" />
          <p className="text-sm font-medium text-red-600">{error}</p>
          <button
            onClick={() => navigate("/installments/list")}
            className="mt-4 rounded-xl bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            بازگشت به لیست
          </button>
        </div>
      </div>
    );
  }

  if (!record) return null;

  return (
    <div dir="rtl" className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate("/installments/list")}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            جزئیات قسط
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">
            اطلاعات کامل تسهیلات ثبت‌شده
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/installments/edit/${record.id}`)}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-600 transition-all hover:bg-indigo-100"
          >
            <Pencil className="h-3.5 w-3.5" />
            ویرایش
          </button>
          <button
            onClick={() => setConfirmDeleteOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 transition-all hover:bg-red-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
            حذف
          </button>
        </div>
      </div>

      {/* Inline error (after successful fetch but delete/payment failed) */}
      {error && record && (
        <div className="mb-6 rounded-xl border border-red-200/60 bg-red-50/70 px-4 py-3 text-center text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* Main Info Card */}
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{record.title}</h2>
            <span className="mt-0.5 inline-block rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
              تسهیلات بانکی
            </span>
          </div>
        </div>

        {/* Bank & Loan Details */}
        {data && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Bank Name */}
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                <Landmark className="h-4.5 w-4.5 text-indigo-400" />
                <div>
                  <p className="text-[11px] font-semibold text-gray-500">
                    نام بانک
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {data.bank_name}
                  </p>
                </div>
              </div>

              {/* Total Loan */}
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                <Banknote className="h-4.5 w-4.5 text-emerald-400" />
                <div>
                  <p className="text-[11px] font-semibold text-gray-500">
                    مبلغ کل وام
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(data.total_loan_amount)}
                  </p>
                </div>
              </div>

              {/* Installment Amount */}
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                <Hash className="h-4.5 w-4.5 text-amber-400" />
                <div>
                  <p className="text-[11px] font-semibold text-gray-500">
                    مبلغ هر قسط
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(data.installment_amount)}
                  </p>
                </div>
              </div>

              {/* Total Installments */}
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                <FileText className="h-4.5 w-4.5 text-rose-400" />
                <div>
                  <p className="text-[11px] font-semibold text-gray-500">
                    تعداد اقساط
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {data.total_installments} قسط
                  </p>
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
              <Calendar className="h-4.5 w-4.5 text-violet-400" />
              <div>
                <p className="text-[11px] font-semibold text-gray-500">
                  بازه زمانی
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {formatJalaliDate(data.start_date)} — {formatJalaliDate(data.end_date)}
                </p>
              </div>
            </div>

            {/* Payment Methods */}
            {data.payment_methods && data.payment_methods.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-indigo-400" />
                  <p className="text-xs font-bold text-gray-700">
                    شیوه‌های پرداخت
                  </p>
                </div>
                <div className="space-y-2">
                  {data.payment_methods.map((method, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-xl border border-black/5 bg-gray-50/80 px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                          {PAYMENT_METHOD_LABELS[method.type] || method.type}
                        </span>
                      </div>
                      {method.value && (
                        <span
                          dir={
                            method.type === "card_transfer" ? "ltr" : "rtl"
                          }
                          className="font-mono text-sm text-gray-700"
                        >
                          {method.type === "card_transfer" && method.value
                            ? formatCardNumber(method.value)
                            : method.value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {data.notes && (
              <div className="flex items-start gap-3 rounded-xl bg-amber-50/50 p-4">
                <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div>
                  <p className="text-[11px] font-semibold text-gray-500">
                    یادداشت
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-gray-700">
                    {data.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Schedule */}
      {schedule.length > 0 && (
        <div className="sticky top-0 z-10 mt-4 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-4.5 w-4.5 text-indigo-500" />
            <h2 className="text-sm font-bold text-gray-900">
              برنامه پرداخت اقساط
            </h2>
          </div>

          {/* Summary */}
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <p className="text-[11px] font-semibold text-gray-500">تعداد کل</p>
              <p className="mt-0.5 text-lg font-bold text-gray-900">
                {totalCount}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-center">
              <p className="text-[11px] font-semibold text-amber-600">
                سررسید شده
              </p>
              <p className="mt-0.5 text-lg font-bold text-amber-700">
                {dueCount}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-center">
              <p className="text-[11px] font-semibold text-emerald-600">
                پرداخت شده
              </p>
              <p className="mt-0.5 text-lg font-bold text-emerald-700">
                {paidCount}
              </p>
            </div>
            <div className="rounded-xl bg-rose-50 p-3 text-center">
              <p className="text-[11px] font-semibold text-rose-600">
                باقی‌مانده
              </p>
              <p className="mt-0.5 text-lg font-bold text-rose-700">
                {remainingCount}
              </p>
            </div>
          </div>

          {/* Schedule list — scrollable when many installments */}
          <div className="max-h-[50vh] space-y-2 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
            {schedule.map((item) => (
              <div key={item.index}>
                {/* Main installment row */}
                <div
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                    item.paid
                      ? "border-emerald-200/60 bg-emerald-50/50"
                      : item.due
                        ? "border-amber-200/60 bg-amber-50/30"
                        : "border-black/5 bg-gray-50/50"
                  }`}
                >
                  {/* Checkbox — shows payment form for unpaid, or toggle unpay for paid */}
                  {item.paid ? (
                    <button
                      type="button"
                      onClick={() => setUnpayConfirmOpen(item.index)}
                      disabled={unpaying === item.index}
                      className="shrink-0 focus:outline-none disabled:opacity-50"
                      aria-label={`لغو پرداخت قسط ${item.index}`}
                    >
                      {unpaying === item.index ? (
                        <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentFormOpen(item.index);
                        setPaymentMethod("");
                        setPaymentDate("");
                        setPaymentNote("");
                      }}
                      disabled={paymentFormOpen !== null}
                      className="shrink-0 focus:outline-none disabled:opacity-50"
                      aria-label={`پرداخت قسط ${item.index}`}
                    >
                      {item.due ? (
                        <CircleDot className="h-5 w-5 text-amber-400" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300" />
                      )}
                    </button>
                  )}

                  {/* Installment info */}
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <span className="text-sm font-bold text-gray-900">
                      قسط {item.index}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        سررسید: {item.dueDateJalali}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.paid
                            ? "bg-emerald-100 text-emerald-700"
                            : item.due
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {item.paid
                          ? "پرداخت شده"
                          : item.due
                            ? "سررسید شده"
                            : "آینده"}
                      </span>
                      {/* Accordion toggle for paid installments */}
                      {item.paid && item.payment && (
                        <button
                          type="button"
                          onClick={() => setExpandedAccordion(expandedAccordion === item.index ? null : item.index)}
                          className="flex h-5 w-5 items-center justify-center text-gray-400 hover:text-gray-600"
                        >
                          {expandedAccordion === item.index ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Accordion for paid installments */}
                {item.paid && item.payment && expandedAccordion === item.index && (
                  <div className="ml-8 mr-4 mt-1 rounded-xl border border-emerald-200/40 bg-emerald-50/30 p-4 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-xs font-semibold text-gray-500">تاریخ پرداخت:</span>
                        <span className="text-xs font-bold text-gray-900">
                          {item.payment.payment_date ? formatJalaliDate(item.payment.payment_date) : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-xs font-semibold text-gray-500">نحوه پرداخت:</span>
                        <span className="text-xs font-bold text-gray-900">
                          {item.payment.payment_method || "—"}
                        </span>
                      </div>
                      {item.payment.note && (
                        <div className="flex items-start gap-2">
                          <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span className="text-xs font-semibold text-gray-500">یادداشت:</span>
                          <span className="text-xs text-gray-700">{item.payment.note}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment form for unpaid installments */}
                {paymentFormOpen === item.index && (
                  <div className="ml-8 mr-4 mt-1 rounded-xl border border-amber-200/40 bg-amber-50/30 p-4 transition-all">
                    <h4 className="mb-3 text-xs font-bold text-gray-700">
                      ثبت پرداخت قسط {item.index}
                    </h4>
                    <div className="space-y-3">
                      {/* Payment Method */}
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                          نحوه پرداخت *
                        </label>
                        <CustomSelect
                          value={paymentMethod}
                          options={PAYMENT_METHOD_OPTIONS}
                          placeholder="انتخاب کنید..."
                          onChange={setPaymentMethod}
                          required
                        />
                      </div>

                      {/* Payment Date */}
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                          تاریخ پرداخت *
                        </label>
                        <JalaliDatePicker
                          value={paymentDate}
                          onChange={setPaymentDate}
                          required
                        />
                      </div>

                      {/* Note */}
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                          یادداشت
                        </label>
                        <input
                          type="text"
                          value={paymentNote}
                          onChange={(e) => setPaymentNote(e.target.value)}
                          placeholder="اختیاری..."
                          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleStorePayment(item.index)}
                          disabled={submittingPayment}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 disabled:opacity-50"
                        >
                          {submittingPayment ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          ثبت پرداخت
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentFormOpen(null)}
                          disabled={submittingPayment}
                          className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-50"
                        >
                          انصراف
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
        {record.created_at && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            ایجاد: {formatJalaliDate(record.created_at)}
          </span>
        )}
        {record.updated_at && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            بروزرسانی: {formatJalaliDate(record.updated_at)}
          </span>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="حذف قسط"
        description={`آیا از حذف «${record.title}» اطمینان دارید؟ این عمل قابل بازگشت نیست.`}
        confirmLabel="بله، حذف شود"
        cancelLabel="انصراف"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDeleteOpen(false)}
      />

      {/* Unpay Confirmation Dialog */}
      <ConfirmDialog
        open={unpayConfirmOpen !== null}
        title="لغو پرداخت"
        description={`آیا از لغو پرداخت قسط ${unpayConfirmOpen} اطمینان دارید؟`}
        confirmLabel="بله، لغو شود"
        cancelLabel="انصراف"
        variant="danger"
        loading={unpaying !== null}
        onConfirm={() => unpayConfirmOpen !== null && handleDeletePayment(unpayConfirmOpen)}
        onCancel={() => setUnpayConfirmOpen(null)}
      />
    </div>
  );
}

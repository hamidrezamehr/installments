import { useState, useEffect } from "react";
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
} from "lucide-react";
import type { InstallmentRecord } from "../types/installment";
import { getInstallment, deleteInstallment } from "../api/installments";
import { PAYMENT_METHOD_LABELS } from "../types/installment";
import ConfirmDialog from "../components/confirm-dialog";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("fa-IR");
  } catch {
    return dateStr;
  }
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

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      try {
        const data = await getInstallment(Number(id));
        if (!cancelled) {
          setRecord(data);
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

  const data = record.data;

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

      {/* Inline error (after successful fetch but delete failed) */}
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
                  {formatDate(data.start_date)} — {formatDate(data.end_date)}
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
                          {method.value}
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

      {/* Timestamps */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
        {record.created_at && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            ایجاد: {formatDate(record.created_at)}
          </span>
        )}
        {record.updated_at && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            بروزرسانی: {formatDate(record.updated_at)}
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
    </div>
  );
}

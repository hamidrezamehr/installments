import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Landmark,
  CreditCard,
  Calendar,
  Loader2,
  Inbox,
} from "lucide-react";
import type { InstallmentRecord } from "../types/installment";
import { getInstallments, deleteInstallment } from "../api/installments";
import ConfirmDialog from "../components/confirm-dialog";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
}

export default function InstallmentList() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<InstallmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<InstallmentRecord | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    setLoading(true);
    setError("");
    try {
      const data = await getInstallments();
      setRecords(data);
    } catch {
      setError("خطا در دریافت لیست اقساط");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await deleteInstallment(deleteTarget.id);
      setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError("خطا در حذف قسط");
    } finally {
      setDeleting(false);
    }
  }

  function handleEdit(record: InstallmentRecord) {
    if (record.category === "bank_facility") {
      navigate(`/installments/edit/${record.id}`);
    }
  }

  return (
    <div dir="rtl" className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            لیست اقساط
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            اقساط ثبت‌شده خود را مشاهده، ویرایش یا حذف کنید
          </p>
        </div>
        <button
          onClick={() => navigate("/installments")}
          className="flex items-center gap-2 rounded-xl bg-linear-to-l from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-600 hover:to-violet-700 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="h-4 w-4" />
          ثبت جدید
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200/60 bg-red-50/70 px-4 py-3 text-center text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      )}

      {/* Empty */}
      {!loading && records.length === 0 && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50">
          <Inbox className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-base font-bold text-gray-900">
            قسطی ثبت نشده
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            هنوز هیچ اقساطی ثبت نکرده‌اید. روی «ثبت جدید» کلیک کنید.
          </p>
        </div>
      )}

      {/* Records */}
      {!loading && records.length > 0 && (
        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="group rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-black/5"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Info */}
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-bold text-gray-900">
                      {record.title}
                    </h3>
                    {record.data && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Landmark className="h-3.5 w-3.5" />
                          {record.data.bank_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3.5 w-3.5" />
                          {formatCurrency(record.data.installment_amount)}
                          × {record.data.total_installments} قسط
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {record.data.start_date} — {record.data.end_date}
                        </span>
                      </div>
                    )}
                    {record.data?.notes && (
                      <p className="mt-1.5 truncate text-xs text-gray-400">
                        {record.data.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => handleEdit(record)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-indigo-50 hover:text-indigo-500"
                    title="ویرایش"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(record)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف قسط"
        description={`آیا از حذف «${deleteTarget?.title}» اطمینان دارید؟ این عمل قابل بازگشت نیست.`}
        confirmLabel="بله، حذف شود"
        cancelLabel="انصراف"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

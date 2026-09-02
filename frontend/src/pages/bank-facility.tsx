import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Plus,
  Trash2,
  Building2,
  Calendar,
  CreditCard,
  Banknote,
  Hash,
  FileText,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  type BankFacility,
  type PaymentMethod,
  type PaymentMethodType,
  PAYMENT_METHOD_LABELS,
} from "../types/installment";
import {
  createBankFacility,
  getInstallment,
  updateBankFacility,
} from "../api/installments";
import ConfirmDialog from "../components/confirm-dialog";

const IRANIAN_BANKS = [
  "بانک ملی ایران",
  "بانک صادرات ایران",
  "بانک تجارت",
  "بانک ملت",
  "بانک رفاه کارگران",
  "بانک سپه",
  "بانک پاسارگاد",
  "بانک کارآفرین",
  "بانک آینده",
  "بانک سامان",
  "بانک پارسیان",
  "بانک اقتصاد نوین",
  "بانک پست بانک",
  "بانک خاورمیانه",
  "بانک شهر",
  "بانک حکمت ایرانیان",
  "بانک گردشگری",
  "بانک توسعه تعاون",
  "بانک توسعه صادرات",
  "بانک صنعت و معدن",
  "بانک کشاورزی",
  "بانک مسکن",
  "سایر",
];

const PAYMENT_METHOD_OPTIONS: { type: PaymentMethodType; label: string }[] = [
  { type: "card_transfer", label: "کارت به کارت" },
  { type: "account_number", label: "شماره حساب" },
  { type: "facility_number", label: "شماره تسهیلات" },
];

const EMPTY_FORM: BankFacility = {
  title: "",
  bank_name: "",
  total_installments: 12,
  total_loan_amount: 0,
  installment_amount: 0,
  start_date: "",
  end_date: "",
  payment_methods: [
    { type: "card_transfer", label: "کارت به کارت", value: "" },
  ],
  notes: "",
};

export default function BankFacilityForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<BankFacility>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [fetchingRecord, setFetchingRecord] = useState(isEdit);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Confirmation dialog
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Fetch existing record in edit mode
  useEffect(() => {
    if (!id) return;
    setFetchingRecord(true);
    getInstallment(Number(id))
      .then((record) => {
        setForm(record.data || EMPTY_FORM);
      })
      .catch(() => setError("خطا در بارگذاری اطلاعات"))
      .finally(() => setFetchingRecord(false));
  }, [id]);

  const updateField = <K extends keyof BankFacility>(
    key: K,
    value: BankFacility[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addPaymentMethod = () => {
    updateField("payment_methods", [
      ...form.payment_methods,
      { type: "card_transfer", label: "کارت به کارت", value: "" },
    ]);
  };

  const removePaymentMethod = (index: number) => {
    if (form.payment_methods.length <= 1) return;
    updateField(
      "payment_methods",
      form.payment_methods.filter((_, i) => i !== index),
    );
  };

  const updatePaymentMethod = (
    index: number,
    field: keyof PaymentMethod,
    value: string,
  ) => {
    const updated = [...form.payment_methods];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "type") {
      updated[index].label = PAYMENT_METHOD_LABELS[value as PaymentMethodType];
    }
    updateField("payment_methods", updated);
  };

  // Called when user clicks submit button — opens confirm dialog
  function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setConfirmOpen(true);
  }

  // Called from confirm dialog
  async function handleConfirmSave() {
    setError("");
    setLoading(true);

    try {
      if (isEdit && id) {
        await updateBankFacility(Number(id), form);
      } else {
        await createBankFacility(form);
      }
      setSuccess(true);
      setTimeout(() => navigate("/installments/list"), 2000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "خطا در ثبت اطلاعات";
      setError(message);
      setConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  }

  if (fetchingRecord) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">
          اطلاعات با موفقیت {isEdit ? "ویرایش" : "ثبت"} شد
        </h2>
        <p className="text-sm text-gray-500">
          در حال انتقال به صفحه لیست اقساط...
        </p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate("/installments/list")}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            {isEdit ? "ویرایش تسهیلات بانکی" : "تسهیلات بانکی"}
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">
            {isEdit
              ? "اطلاعات تسهیلات را ویرایش کنید"
              : "اطلاعات تسهیلات دریافتی از بانک را وارد کنید"}
          </p>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Loan Info */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Building2 className="h-4.5 w-4.5 text-indigo-500" />
            <h2 className="text-sm font-bold text-gray-900">اطلاعات تسهیلات</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                عنوان تسهیلات *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
                placeholder="مثال: وام مسکن بانک ملت"
                className="w-full rounded-xl border border-black/10 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                نام بانک *
              </label>
              <select
                value={form.bank_name}
                onChange={(e) => updateField("bank_name", e.target.value)}
                required
                className="w-full rounded-xl border border-black/10 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">انتخاب کنید...</option>
                {IRANIAN_BANKS.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                مبلغ کل وام (ریال) *
              </label>
              <div className="relative">
                <Banknote className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={form.total_loan_amount || ""}
                  onChange={(e) =>
                    updateField("total_loan_amount", Number(e.target.value))
                  }
                  required
                  min={0}
                  placeholder="مثال: 500000000"
                  className="w-full rounded-xl border border-black/10 bg-gray-50 py-2.5 pr-10 pl-4 text-sm text-gray-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                مبلغ هر قسط (ریال) *
              </label>
              <div className="relative">
                <Hash className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={form.installment_amount || ""}
                  onChange={(e) =>
                    updateField("installment_amount", Number(e.target.value))
                  }
                  required
                  min={0}
                  placeholder="مثال: 45000000"
                  className="w-full rounded-xl border border-black/10 bg-gray-50 py-2.5 pr-10 pl-4 text-sm text-gray-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                تعداد اقساط (ماه) *
              </label>
              <div className="relative">
                <FileText className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={form.total_installments}
                  onChange={(e) =>
                    updateField("total_installments", Number(e.target.value))
                  }
                  required
                  min={1}
                  max={360}
                  className="w-full rounded-xl border border-black/10 bg-gray-50 py-2.5 pr-10 pl-4 text-sm text-gray-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div />
          </div>
        </div>

        {/* Date Range */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Calendar className="h-4.5 w-4.5 text-indigo-500" />
            <h2 className="text-sm font-bold text-gray-900">
              تاریخ شروع و پایان
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                تاریخ شروع تسهیلات *
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => updateField("start_date", e.target.value)}
                required
                className="w-full rounded-xl border border-black/10 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                تاریخ پایان تسهیلات *
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => updateField("end_date", e.target.value)}
                required
                className="w-full rounded-xl border border-black/10 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4.5 w-4.5 text-indigo-500" />
              <h2 className="text-sm font-bold text-gray-900">
                شیوه پرداخت
              </h2>
            </div>
            <button
              type="button"
              onClick={addPaymentMethod}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
            >
              <Plus className="h-3.5 w-3.5" />
              افزودن شیوه پرداخت
            </button>
          </div>

          <div className="space-y-4">
            {form.payment_methods.map((method, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-xl border border-black/5 bg-gray-50/50 p-4"
              >
                <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                  <div className="sm:w-48">
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                      نوع شیوه پرداخت
                    </label>
                    <select
                      value={method.type}
                      onChange={(e) =>
                        updatePaymentMethod(index, "type", e.target.value)
                      }
                      className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {PAYMENT_METHOD_OPTIONS.map((opt) => (
                        <option key={opt.type} value={opt.type}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                      {method.label}
                    </label>
                    <input
                      type="text"
                      value={method.value}
                      onChange={(e) =>
                        updatePaymentMethod(index, "value", e.target.value)
                      }
                      dir={method.type === "card_transfer" ? "ltr" : "rtl"}
                      placeholder={
                        method.type === "card_transfer"
                          ? "0000-0000-0000-0000"
                          : method.type === "account_number"
                            ? "شماره حساب"
                            : "شماره تسهیلات"
                      }
                      className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {form.payment_methods.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePaymentMethod(index)}
                    className="mt-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <label className="mb-1.5 block text-xs font-semibold text-gray-700">
            یادداشت (اختیاری)
          </label>
          <textarea
            value={form.notes || ""}
            onChange={(e) => updateField("notes", e.target.value)}
            rows={3}
            placeholder="هر نکته‌ای که می‌خواهید درباره این تسهیلات یادداشت کنید..."
            className="w-full resize-none rounded-xl border border-black/10 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200/60 bg-red-50/70 px-4 py-3 text-center text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-linear-to-l from-indigo-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-600 hover:to-violet-700 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال ثبت...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {isEdit ? "ذخیره تغییرات" : "ثبت تسهیلات"}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate("/installments/list")}
            className="rounded-xl border border-black/10 bg-white px-6 py-3 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50"
          >
            انصراف
          </button>
        </div>
      </form>

      {/* Save Confirmation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title={isEdit ? "ذخیره تغییرات" : "ثبت تسهیلات"}
        description={
          isEdit
            ? "آیا از ذخیره تغییرات اطمینان دارید؟"
            : "آیا از ثبت اطلاعات تسهیلات اطمینان دارید؟"
        }
        confirmLabel={isEdit ? "بله، ذخیره شود" : "بله، ثبت شود"}
        cancelLabel="انصراف"
        variant="primary"
        loading={loading}
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

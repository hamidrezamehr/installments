import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js";
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
import { useToast } from "../components/toast";
import JalaliDatePicker from "../components/jalali-date-picker";
import CustomSelect from "../components/custom-select";
import type { CustomSelectOption } from "../components/custom-select";

/* ── Formatting helpers ────────────────────────────────────── */

/** Format a number with comma separators for display */
function formatWithCommas(n: number | ""): string {
  if (n === "" || n === 0) return "";
  return n.toLocaleString("en-US");
}

/** Format card number as XXXX-XXXX-XXXX-XXXX */
function formatCardNumber(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}

/** Strip dashes and non-digits from card value */
function cardDigits(raw: string): string {
  return raw.replace(/[^0-9]/g, "").slice(0, 16);
}

/* ── End-date calculation ──────────────────────────────────── */

/**
 * Calculate the facility end date as the last installment's due date.
 * Installments are monthly (project convention), so the end date is the
 * start date plus (total_installments - 1) Jalali months, clamped to the
 * target month's max day (handles 29/30/31-day months and leap years).
 *
 * Returns a Gregorian YYYY-MM-DD string, or "" when inputs are invalid.
 */
function calculateEndDate(
  startDate: string,
  totalInstallments: number,
): string {
  if (!startDate || !totalInstallments || totalInstallments < 1) return "";

  const d = new Date(startDate + "T00:00:00");
  if (isNaN(d.getTime())) return "";

  const { jy, jm, jd } = toJalaali(d);
  const monthsToAdd = totalInstallments - 1;
  const totalMonths = jy * 12 + (jm - 1) + monthsToAdd;
  const endJy = Math.floor(totalMonths / 12);
  const endJm = (totalMonths % 12) + 1;
  const endJd = Math.min(jd, jalaaliMonthLength(endJy, endJm));

  const g = toGregorian(endJy, endJm, endJd);
  return `${String(g.gy).padStart(4, "0")}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;
}

/* ── Constants ─────────────────────────────────────────────── */

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

const BANK_OPTIONS: CustomSelectOption[] = IRANIAN_BANKS.map((bank) => ({
  value: bank,
  label: bank,
}));

const PAYMENT_TYPE_OPTIONS: CustomSelectOption[] = PAYMENT_METHOD_OPTIONS.map(
  (opt) => ({ value: opt.type, label: opt.label }),
);

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

/* ── Component ─────────────────────────────────────────────── */

export default function BankFacilityForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<BankFacility>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [fetchingRecord, setFetchingRecord] = useState(() => isEdit);
  const [error, setError] = useState("");

  // When true, the user edited the end date manually, so automatic
  // recalculation must not overwrite it.
  const [endDateManuallyEdited, setEndDateManuallyEdited] =
    useState(false);

  // Per-field validation errors, keyed by form field name. The message
  // uses the field's visible label, e.g. "تاریخ شروع تسهیلات must not be empty."
  const [fieldErrors, setFieldErrors] = useState<Partial<
    Record<keyof BankFacility, string>
  >>({});

  // Confirmation dialog
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { notify, renderToast } = useToast();

  // Display-only formatted values for currency inputs
  const [loanDisplay, setLoanDisplay] = useState("");
  const [installmentDisplay, setInstallmentDisplay] = useState("");

  // Fetch existing record in edit mode.
  // The stored end_date is authoritative and must not be overwritten.
  useEffect(() => {
    if (!id) return;
    getInstallment(Number(id))
      .then((record) => {
        const d = record.data || EMPTY_FORM;
        setForm(d);
        setLoanDisplay(formatWithCommas(d.total_loan_amount));
        setInstallmentDisplay(formatWithCommas(d.installment_amount));
        // The stored end_date is authoritative: only allow auto-recalc when
        // it already matches the calculated value (i.e. it was never
        // customized by the user).
        setEndDateManuallyEdited(
          Boolean(
            d.start_date &&
              d.total_installments &&
              d.end_date !==
                calculateEndDate(d.start_date, d.total_installments),
          ),
        );
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

  /* ── Validation ────────────────────────────────────────────── */

  /** Required-field labels, matching the visible form labels. */
  const FIELD_LABELS: Record<string, string> = {
    title: "عنوان تسهیلات",
    bank_name: "نام بانک",
    total_loan_amount: "مبلغ کل وام",
    installment_amount: "مبلغ هر قسط",
    total_installments: "تعداد اقساط",
    start_date: "تاریخ شروع تسهیلات",
    end_date: "تاریخ پایان تسهیلات",
    payment_methods: "شیوه پرداخت",
  };

  /** Validate one field against a concrete value; returns an error message or "". */
  function validateFieldValue(
    key: keyof BankFacility,
    value: BankFacility[keyof BankFacility],
  ): string {
    const label = FIELD_LABELS[key];
    if (!label) return "";

    let invalid = false;
    if (key === "payment_methods") {
      const methods = value as PaymentMethod[];
      invalid =
        methods.length === 0 ||
        methods.some((m) => !m.type || !m.value.trim());
    } else if (typeof value === "string") {
      invalid = value.trim() === "";
    } else if (typeof value === "number") {
      invalid = value <= 0;
    }
    return invalid ? `${label} must not be empty.` : "";
  }

  /** Validate all required fields; returns the error map (empty if valid). */
  function validateAllFields(
    formToValidate: BankFacility,
  ): Partial<Record<keyof BankFacility, string>> {
    const requiredKeys: (keyof BankFacility)[] = [
      "title",
      "bank_name",
      "total_loan_amount",
      "installment_amount",
      "total_installments",
      "start_date",
      "end_date",
      "payment_methods",
    ];
    const errors: Partial<Record<keyof BankFacility, string>> = {};
    for (const key of requiredKeys) {
      const msg = validateFieldValue(key, formToValidate[key]);
      if (msg) errors[key] = msg;
    }
    return errors;
  }

  /**
   * Re-validate one field on change using the NEW value (not the stale
   * closure form); clears the error as soon as the field becomes valid.
   */
  const revalidateField = (
    key: keyof BankFacility,
    value: BankFacility[keyof BankFacility],
  ) => {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const msg = validateFieldValue(key, value);
      if (msg) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  /**
   * Start-date change: also recalculate the end date unless the user has
   * manually customized it.
   */
  const handleStartDateChange = (gregorianDate: string) => {
    setForm((prev) => {
      const next = { ...prev, start_date: gregorianDate };
      if (!endDateManuallyEdited) {
        const calculated = calculateEndDate(
          gregorianDate,
          prev.total_installments,
        );
        if (calculated) next.end_date = calculated;
      }
      return next;
    });
    revalidateField("start_date", gregorianDate);
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
    revalidateField("payment_methods", updated);
  };

  function handleTitleChange(v: string) {
    updateField("title", v);
    revalidateField("title", v);
  }

  /* ── Formatted input handlers ─────────────────────────────── */

  function handleLoanAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const digits = raw.replace(/[^0-9]/g, "");
    if (digits === "") {
      setLoanDisplay("");
      updateField("total_loan_amount", 0);
      return;
    }
    const num = Number(digits);
    setLoanDisplay(formatWithCommas(num));
    updateField("total_loan_amount", num);
    revalidateField("total_loan_amount", num);
  }

  function handleInstallmentAmountChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const raw = e.target.value;
    const digits = raw.replace(/[^0-9]/g, "");
    if (digits === "") {
      setInstallmentDisplay("");
      updateField("installment_amount", 0);
      return;
    }
    const num = Number(digits);
    setInstallmentDisplay(formatWithCommas(num));
    updateField("installment_amount", num);
    revalidateField("installment_amount", num);
  }

  function handleInstallmentCountChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const raw = e.target.value;
    if (raw === "") {
      updateField("total_installments", 0);
      revalidateField("total_installments", 0);
      return;
    }
    // Strip leading zeros and non-digits
    const cleaned = raw.replace(/^0+/, "").replace(/[^0-9]/g, "");
    if (cleaned === "") {
      updateField("total_installments", 0);
      revalidateField("total_installments", 0);
      return;
    }
    const count = Number(cleaned);
    setForm((prev) => {
      const next = { ...prev, total_installments: count };
      // Recalculate end date from the new count unless manually edited.
      if (!endDateManuallyEdited && prev.start_date) {
        const calculated = calculateEndDate(prev.start_date, count);
        if (calculated) next.end_date = calculated;
      }
      return next;
    });
    revalidateField("total_installments", count);
  }

  function handleCardNumberChange(
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const formatted = formatCardNumber(e.target.value);
    const digits = cardDigits(formatted);
    updatePaymentMethod(index, "value", digits);
    // Update display
    const input = e.target;
    // We store digits in state but display formatted
    // Use a ref-like approach via the input's own value
    requestAnimationFrame(() => {
      input.value = formatted;
    });
  }

  /* ── Submit ───────────────────────────────────────────────── */

  // Called when user clicks submit button — validates required fields
  // first, then opens the confirm dialog only if the form is valid.
  function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const errors = validateAllFields(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      // Don't open the confirm dialog when the form is invalid.
      return;
    }

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
      // Navigate immediately on success — no artificial delay. The list
      // page shows the success toast from navigation state.
      navigate("/installments/list", {
        state: {
          toast: isEdit
            ? "تغییرات با موفقیت ذخیره شد"
            : "تسهیلات با موفقیت ثبت شد",
        },
      });
    } catch (err: unknown) {
      let message = "خطا در ثبت اطلاعات";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (data?.message) {
          message = data.message;
          if (data.detail) message += ` (${data.detail})`;
        } else if (data?.errors) {
          const validationErrors = data.errors as Record<string, string[]>;
          // Map backend validation errors to the matching inputs when possible.
          const mapped: Partial<Record<keyof BankFacility, string>> = {};
          for (const [field, messages] of Object.entries(validationErrors)) {
            if (field in FIELD_LABELS) {
              mapped[field as keyof BankFacility] = messages.join(" ");
            }
          }
          if (Object.keys(mapped).length > 0) {
            setFieldErrors(mapped);
          }
          message = Object.values(validationErrors).flat().join("\n");
        } else if (err.response?.statusText) {
          message = `${err.response.status} - ${err.response.statusText}`;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      notify(message, "error");
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
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                placeholder="مثال: وام مسکن بانک ملت"
                className={`w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:ring-2 ${
                  fieldErrors.title
                    ? "border-red-400 focus:border-red-400 focus:ring-red-500/20"
                    : "border-black/10 focus:border-indigo-400 focus:ring-indigo-500/20"
                }`}
              />
              {fieldErrors.title && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {fieldErrors.title}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                نام بانک *
              </label>
              <CustomSelect
                value={form.bank_name}
                options={BANK_OPTIONS}
                placeholder="انتخاب کنید..."
                onChange={(v) => {
                  updateField("bank_name", v);
                  revalidateField("bank_name", v);
                }}
                required
                invalid={Boolean(fieldErrors.bank_name)}
              />
              {fieldErrors.bank_name && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {fieldErrors.bank_name}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                مبلغ کل وام (ریال) *
              </label>
              <div className="relative">
                <Banknote className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={loanDisplay}
                  onChange={handleLoanAmountChange}
                  required
                  placeholder="مثال: 500,000,000"
                  className={`w-full rounded-xl border bg-gray-50 py-2.5 pr-10 pl-4 text-sm text-gray-900 outline-none transition-all focus:bg-white focus:ring-2 ${
                    fieldErrors.total_loan_amount
                      ? "border-red-400 focus:border-red-400 focus:ring-red-500/20"
                      : "border-black/10 focus:border-indigo-400 focus:ring-indigo-500/20"
                  }`}
                />
              </div>
              {fieldErrors.total_loan_amount && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {fieldErrors.total_loan_amount}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                مبلغ هر قسط (ریال) *
              </label>
              <div className="relative">
                <Hash className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={installmentDisplay}
                  onChange={handleInstallmentAmountChange}
                  required
                  placeholder="مثال: 45,000,000"
                  className={`w-full rounded-xl border bg-gray-50 py-2.5 pr-10 pl-4 text-sm text-gray-900 outline-none transition-all focus:bg-white focus:ring-2 ${
                    fieldErrors.installment_amount
                      ? "border-red-400 focus:border-red-400 focus:ring-red-500/20"
                      : "border-black/10 focus:border-indigo-400 focus:ring-indigo-500/20"
                  }`}
                />
              </div>
              {fieldErrors.installment_amount && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {fieldErrors.installment_amount}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                تعداد اقساط (ماه) *
              </label>
              <div className="relative">
                <FileText className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.total_installments || ""}
                  onChange={handleInstallmentCountChange}
                  required
                  min={1}
                  max={360}
                  placeholder="12"
                  className={`w-full rounded-xl border bg-gray-50 py-2.5 pr-10 pl-4 text-sm text-gray-900 outline-none transition-all focus:bg-white focus:ring-2 ${
                    fieldErrors.total_installments
                      ? "border-red-400 focus:border-red-400 focus:ring-red-500/20"
                      : "border-black/10 focus:border-indigo-400 focus:ring-indigo-500/20"
                  }`}
                />
              </div>
              {fieldErrors.total_installments && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {fieldErrors.total_installments}
                </p>
              )}
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
              <JalaliDatePicker
                value={form.start_date}
                onChange={handleStartDateChange}
                required
                invalid={Boolean(fieldErrors.start_date)}
              />
              {fieldErrors.start_date && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {fieldErrors.start_date}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                تاریخ پایان تسهیلات *
              </label>
              <JalaliDatePicker
                value={form.end_date}
                onChange={(g) => {
                  // Manual edit — stop auto-overwriting from now on.
                  setEndDateManuallyEdited(true);
                  updateField("end_date", g);
                  revalidateField("end_date", g);
                }}
                required
                invalid={Boolean(fieldErrors.end_date)}
              />
              {fieldErrors.end_date && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {fieldErrors.end_date}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4.5 w-4.5 text-indigo-500" />
              <h2 className="text-sm font-bold text-gray-900">شیوه پرداخت</h2>
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
                  <div className="w-48 shrink-0">
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                      نوع شیوه پرداخت
                    </label>
                    <CustomSelect
                      value={method.type}
                      options={PAYMENT_TYPE_OPTIONS}
                      placeholder="انتخاب کنید..."
                      onChange={(v) => updatePaymentMethod(index, "type", v)}
                      invalid={
                        Boolean(fieldErrors.payment_methods) &&
                        !method.type
                      }
                    />
                  </div>

                  <div className="flex-1">
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                      {method.label}
                    </label>
                    <input
                      type="text"
                      defaultValue={
                        method.type === "card_transfer"
                          ? formatCardNumber(method.value)
                          : method.value
                      }
                      key={`${index}-${method.type}`}
                      onChange={
                        method.type === "card_transfer"
                          ? (e) => handleCardNumberChange(index, e)
                          : (e) =>
                              updatePaymentMethod(
                                index,
                                "value",
                                e.target.value,
                              )
                      }
                      dir={method.type === "card_transfer" ? "ltr" : undefined}
                      placeholder={
                        method.type === "card_transfer"
                          ? "6037-9912-3456-7890"
                          : method.type === "account_number"
                            ? "شماره حساب"
                            : "شماره تسهیلات"
                      }
                      className={`w-full rounded-lg border bg-white px-4 py-2.5 text-base font-medium text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:ring-2 ${
                        Boolean(fieldErrors.payment_methods) &&
                        !method.value.trim()
                          ? "border-red-400 focus:border-red-400 focus:ring-red-500/20"
                          : "border-black/10 focus:border-indigo-400 focus:ring-indigo-500/20"
                      }${method.type !== "card_transfer" ? " num-ltr-value" : ""}`}
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
            {fieldErrors.payment_methods && (
              <p className="text-xs font-medium text-red-600">
                {fieldErrors.payment_methods}
              </p>
            )}
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

      {renderToast()}

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

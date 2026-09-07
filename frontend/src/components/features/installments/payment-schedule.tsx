import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  CheckCircle2,
  CircleDot,
  Circle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { InstallmentPayment } from "../../../types/installment";
import { usePayment } from "../../../hooks/use-payment";
import { useToast } from "../../toast";
import PaymentForm from "./payment-form";
import PaymentAccordion from "./payment-accordion";

interface ScheduleItem {
  index: number;
  dueDateJalali: string;
  dueDateGregorian: string;
  due: boolean;
  paid: boolean;
  payment?: InstallmentPayment;
}

interface PaymentScheduleProps {
  schedule: ScheduleItem[];
  facilityId: number;
  paymentMethodOptions: { value: string; label: string }[];
  onPaymentStored: (payment: InstallmentPayment) => void;
  onPaymentDeleted: (installmentNumber: number) => void;
}

export default function PaymentSchedule({
  schedule,
  facilityId,
  paymentMethodOptions,
  onPaymentStored,
  onPaymentDeleted,
}: PaymentScheduleProps) {
  const { toast } = useToast();
  const { deletePayment, submitting } = usePayment();

  const [paymentFormOpen, setPaymentFormOpen] = useState<number | null>(null);
  const [expandedAccordion, setExpandedAccordion] = useState<number | null>(
    null,
  );
  const [unpayConfirmOpen, setUnpayConfirmOpen] = useState<number | null>(
    null,
  );
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (activeDropdown === null) return;
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [activeDropdown]);

  // Summary counts
  const totalCount = schedule.length;
  const dueCount = schedule.filter((s) => s.due && !s.paid).length;
  const paidCount = schedule.filter((s) => s.paid).length;
  const remainingCount = totalCount - paidCount;

  if (schedule.length === 0) return null;

  return (
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
          <p className="text-[11px] font-semibold text-gray-500">
            تعداد کل
          </p>
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

      {/* Schedule list */}
      <div className="max-h-[50vh] space-y-2 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
        {schedule.map((item) => {
          const isDropdownOpen = activeDropdown === item.index;

          return (
            <div key={item.index}>
              {/* Main installment row — entire row is clickable */}
              <div
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                  item.paid
                    ? "border-emerald-200/60 bg-emerald-50/50"
                    : item.due
                      ? "border-amber-200/60 bg-amber-50/30"
                      : "border-black/5 bg-gray-50/50"
                }`}
              >
                {/* Status icon */}
                {item.paid ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                ) : item.due ? (
                  <CircleDot className="h-5 w-5 shrink-0 text-amber-400" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-gray-300" />
                )}

                {/* Installment info — clickable area */}
                <button
                  type="button"
                  onClick={() => {
                    if (item.paid) {
                      // Toggle accordion for paid items
                      setExpandedAccordion(
                        expandedAccordion === item.index ? null : item.index,
                      );
                    } else if (paymentFormOpen === null) {
                      // Open payment form for unpaid items
                      setPaymentFormOpen(item.index);
                      setExpandedAccordion(null);
                    }
                  }}
                  disabled={paymentFormOpen !== null}
                  className="flex flex-1 items-center justify-between gap-2 text-left disabled:opacity-50"
                >
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
                    {item.paid && item.payment && (
                      <span className="flex h-5 w-5 items-center justify-center text-gray-400">
                        {expandedAccordion === item.index ? (
                          <ChevronUp className="h-4 w-4 transition-transform duration-200" />
                        ) : (
                          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                        )}
                      </span>
                    )}
                  </div>
                </button>

                {/* Dropdown trigger */}
                <div ref={dropdownRef} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(
                        activeDropdown === item.index ? null : item.index,
                      );
                    }}
                    disabled={paymentFormOpen !== null}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isDropdownOpen
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                        : "border-black/10 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    } disabled:opacity-50`}
                  >
                    عملیات
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown menu */}
                  {isDropdownOpen && (
                    <div className="absolute left-0 top-full z-40 mt-1 min-w-[160px] origin-top overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg transition-all duration-200 animate-in">
                      {!item.paid ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(null);
                            setPaymentFormOpen(item.index);
                            setExpandedAccordion(null);
                          }}
                          disabled={paymentFormOpen !== null}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-right text-sm text-gray-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          ثبت پرداخت
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(null);
                            setUnpayConfirmOpen(item.index);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-right text-sm text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <CheckCircle2 className="h-4 w-4 text-red-400" />
                          لغو پرداخت
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Accordion with animation */}
              {item.paid && item.payment && expandedAccordion === item.index && (
                <div className="accordion-enter">
                  <PaymentAccordion payment={item.payment} />
                </div>
              )}

              {/* Payment form */}
              {paymentFormOpen === item.index && (
                <PaymentForm
                  installmentNumber={item.index}
                  facilityId={facilityId}
                  paymentMethodOptions={paymentMethodOptions}
                  onStored={(payment) => {
                    onPaymentStored(payment);
                    setPaymentFormOpen(null);
                    toast("success", `قسط شماره ${item.index} با موفقیت ثبت شد.`);
                  }}
                  onCancel={() => setPaymentFormOpen(null)}
                  onError={(message) => {
                    toast("error", message);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Unpay confirmation — rendered via portal to cover entire layout */}
      {unpayConfirmOpen !== null &&
        createPortal(
          <UnpayConfirmDialog
            installmentNumber={unpayConfirmOpen}
            facilityId={facilityId}
            loading={submitting}
            onConfirm={async () => {
              const success = await deletePayment(facilityId, unpayConfirmOpen);
              if (success) {
                onPaymentDeleted(unpayConfirmOpen);
                toast("success", `پرداخت قسط شماره ${unpayConfirmOpen} لغو شد.`);
              } else {
                toast("error", "لغو پرداخت با خطا مواجه شد. لطفاً دوباره تلاش کنید.");
              }
              setUnpayConfirmOpen(null);
            }}
            onCancel={() => {
              if (!submitting) setUnpayConfirmOpen(null);
            }}
          />,
          document.body,
        )}
    </div>
  );
}

/* ─── Unpay Confirm Dialog (Portal-based) ─── */

interface UnpayConfirmDialogProps {
  installmentNumber: number;
  facilityId: number;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function UnpayConfirmDialog({
  installmentNumber,
  loading,
  onConfirm,
  onCancel,
}: UnpayConfirmDialogProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onCancel();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [loading, onCancel]);

  // Prevent background scrolling
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current && !loading) onCancel();
      }}
      dir="rtl"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/40 bg-white/90 p-6 shadow-2xl shadow-black/10 backdrop-blur-xl animate-in">
        <h3 className="text-[15px] font-bold text-gray-900">
          لغو پرداخت
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          آیا از لغو پرداخت قسط {installmentNumber} اطمینان دارید؟
        </p>
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition-all hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            بله، لغو شود
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex flex-1 items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-50"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}

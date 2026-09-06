import { useState, useCallback } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { InstallmentPayment } from "../../../types/installment";
import { getTodayISO } from "../../../lib/jalali";
import { usePayment } from "../../../hooks/use-payment";
import CustomSelect from "../../custom-select";
import JalaliDatePicker from "../../jalali-date-picker";

interface PaymentFormProps {
  installmentNumber: number;
  facilityId: number;
  paymentMethodOptions: { value: string; label: string }[];
  onStored: (payment: InstallmentPayment) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}

export default function PaymentForm({
  installmentNumber,
  facilityId,
  paymentMethodOptions,
  onStored,
  onCancel,
  onError,
}: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState(
    paymentMethodOptions.length === 1 ? paymentMethodOptions[0].value : "",
  );
  const [paymentDate, setPaymentDate] = useState(getTodayISO());
  const [paymentNote, setPaymentNote] = useState("");

  const { storePayment, submitting } = usePayment();

  const handleSubmit = useCallback(async () => {
    if (!paymentMethod) {
      onError("لطفاً شیوه پرداخت را انتخاب کنید");
      return;
    }

    if (!paymentDate) {
      onError("لطفاً تاریخ پرداخت را وارد کنید");
      return;
    }

    const success = await storePayment(
      facilityId,
      installmentNumber,
      paymentMethod,
      paymentDate,
      paymentNote,
    );

    if (success) {
      // Create payment object for local state update
      const payment: InstallmentPayment = {
        id: Date.now(), // Temporary ID
        installment_id: facilityId,
        installment_number: installmentNumber,
        paid_at: new Date().toISOString(),
        payment_method: paymentMethod,
        payment_date: paymentDate,
        note: paymentNote || undefined,
      };
      onStored(payment);
    }
  }, [
    facilityId,
    installmentNumber,
    paymentMethod,
    paymentDate,
    paymentNote,
    storePayment,
    onStored,
    onError,
  ]);

  return (
    <div className="ml-8 mr-4 mt-1 rounded-xl border border-amber-200/40 bg-amber-50/30 p-4 transition-all">
      <h4 className="mb-3 text-xs font-bold text-gray-700">
        ثبت پرداخت قسط {installmentNumber}
      </h4>
      <div className="space-y-3">
        {/* Payment Method */}
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-gray-500">
            شیوه پرداخت *
          </label>
          <CustomSelect
            value={paymentMethod}
            options={paymentMethodOptions}
            placeholder="انتخاب کنید..."
            onChange={setPaymentMethod}
            required
            className="w-full"
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
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            ثبت پرداخت
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-50"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}

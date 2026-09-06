import { Clock, CreditCard, StickyNote } from "lucide-react";
import type { InstallmentPayment } from "../../../types/installment";
import { formatJalaliDate } from "../../../lib/jalali";

interface PaymentAccordionProps {
  payment: InstallmentPayment;
}

export default function PaymentAccordion({ payment }: PaymentAccordionProps) {
  return (
    <div className="ml-8 mr-4 mt-1 rounded-xl border border-emerald-200/40 bg-emerald-50/30 p-4 transition-all">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-xs font-semibold text-gray-500">
            تاریخ پرداخت:
          </span>
          <span className="text-xs font-bold text-gray-900">
            {payment.payment_date
              ? formatJalaliDate(payment.payment_date)
              : "—"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-xs font-semibold text-gray-500">
            نحوه پرداخت:
          </span>
          <span className="text-xs font-bold text-gray-900">
            {payment.payment_method || "—"}
          </span>
        </div>
        {payment.note && (
          <div className="flex items-start gap-2">
            <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <span className="text-xs font-semibold text-gray-500">
              یادداشت:
            </span>
            <span className="text-xs text-gray-700">{payment.note}</span>
          </div>
        )}
      </div>
    </div>
  );
}

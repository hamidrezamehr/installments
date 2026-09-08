import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Landmark,
  Heart,
  Trophy,
  Receipt,
  GraduationCap,
  HandCoins,
  ArrowLeft,
  Plus,
  Loader2,
  AlertCircle,
  Inbox,
} from "lucide-react";
import {
  PAYMENT_CATEGORIES,
  type InstallmentRecord,
  type PaymentCategoryInfo,
} from "../types/installment";
import { getInstallments, extractApiErrorMessage } from "../api/installments";

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Landmark,
  Heart,
  Trophy,
  Receipt,
  GraduationCap,
  HandCoins,
};

export default function Installments() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [records, setRecords] = useState<InstallmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getInstallments();
        if (!cancelled) {
          setRecords(data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(extractApiErrorMessage(err, "خطا در دریافت اقساط"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectCategory = (category: PaymentCategoryInfo) => {
    if (category.id === "bank_facility") {
      navigate("/installments/new/bank-facility");
    } else {
      alert(`بخش «${category.title}» به زودی اضافه خواهد شد`);
    }
  };

  return (
    <div dir="rtl" className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          ثبت اقساط
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          نوع پرداخت خود را انتخاب کنید تا اطلاعات اقساطتان را ثبت کنید
        </p>
      </div>

      {/* Existing installments */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-bold text-gray-700">
          اقساط ثبت‌شده
        </h2>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-black/10 bg-white py-10">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-200/60 bg-red-50/70 px-4 py-3 text-sm font-medium text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 bg-white/50 py-10 text-center">
            <Inbox className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">
              هنوز اقساطی ثبت نکرده‌اید
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {records.map((record) => (
              <div
                key={record.id}
                className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-gray-900">
                    {record.title}
                  </h3>
                  {record.data.bank_name && (
                    <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-600">
                      {record.data.bank_name}
                    </span>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-500">
                  <span>
                    مبلغ هر قسط:{" "}
                    <span className="font-semibold text-gray-800">
                      {record.data.installment_amount.toLocaleString("fa-IR")} ریال
                    </span>
                  </span>
                  <span>
                    تعداد اقساط:{" "}
                    <span className="font-semibold text-gray-800">
                      {record.data.total_installments}
                    </span>
                  </span>
                  <span>
                    شروع:{" "}
                    <span className="font-semibold text-gray-800">
                      {record.data.start_date}
                    </span>
                  </span>
                  <span>
                    پایان:{" "}
                    <span className="font-semibold text-gray-800">
                      {record.data.end_date}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Category picker */}
      <section>
        <h2 className="mb-4 text-sm font-bold text-gray-700">
          ثبت اقساط جدید
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PAYMENT_CATEGORIES.map((category) => {
            const IconComponent = iconMap[category.icon];
            const isHovered = hoveredCard === category.id;

            return (
              <button
                key={category.id}
                onClick={() => handleSelectCategory(category)}
                onMouseEnter={() => setHoveredCard(category.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`group relative overflow-hidden rounded-2xl border border-black/10 bg-white p-6 text-right shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 ${
                  isHovered ? "border-indigo-200" : ""
                }`}
              >
                <div
                  className={`absolute inset-0 bg-linear-to-br ${category.color} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
                />

                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br ${category.color} text-white shadow-md transition-transform duration-300 group-hover:scale-110`}
                >
                  {IconComponent && <IconComponent className="h-6 w-6" />}
                </div>

                <h3 className="mb-1.5 text-[15px] font-bold text-gray-900">
                  {category.title}
                </h3>
                <p className="text-xs leading-relaxed text-gray-500">
                  {category.description}
                </p>

                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-500 opacity-0 transition-all duration-300 group-hover:opacity-100">
                  <span>ثبت اطلاعات</span>
                  <ArrowLeft className="h-3.5 w-3.5 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 rounded-xl border border-amber-200/60 bg-amber-50/50 p-4">
          <p className="text-xs leading-relaxed text-amber-700">
            <strong>نکته:</strong> پس از ثبت اطلاعات اقساط، می‌توانید وضعیت پرداخت هر قسط
            را مشاهده کرده و یادآوری پرداخت دریافت کنید. بخش‌های «صندوق‌های قرض‌الحسنه»،
            «قرعه‌کشی خانگی» و سایر دسته‌بندی‌ها به زودی اضافه خواهند شد.
          </p>
        </div>
      </section>

      {/* Floating add button */}
      <Link
        to="/installments/new/bank-facility"
        className="fixed bottom-6 left-6 flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-l from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 transition-transform hover:scale-105 active:scale-95 lg:hidden"
        aria-label="ثبت اقساط جدید"
      >
        <Plus className="h-5 w-5" />
      </Link>
    </div>
  );
}

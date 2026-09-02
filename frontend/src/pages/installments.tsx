import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Landmark,
  Heart,
  Trophy,
  Receipt,
  GraduationCap,
  HandCoins,
  ArrowLeft,
} from "lucide-react";
import { PAYMENT_CATEGORIES, type PaymentCategoryInfo } from "../types/installment";

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

  const handleSelectCategory = (category: PaymentCategoryInfo) => {
    if (category.id === "bank_facility") {
      navigate("/installments/new/bank-facility");
    } else {
      alert(`بخش «${category.title}» به زودی اضافه خواهد شد`);
    }
  };

  // Allow navigation to list from here

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

      <div className="mt-6">
        <button
          onClick={() => navigate("/installments/list")}
          className="w-full rounded-xl border border-black/10 bg-white p-4 text-center text-sm font-semibold text-indigo-600 transition-all hover:bg-indigo-50 hover:border-indigo-200"
        >
          مشاهده لیست اقساط ثبت‌شده
        </button>
      </div>

      <div className="mt-8 rounded-xl border border-amber-200/60 bg-amber-50/50 p-4">
        <p className="text-xs leading-relaxed text-amber-700">
          <strong>نکته:</strong> پس از ثبت اطلاعات اقساط، می‌توانید وضعیت پرداخت هر قسط
          را مشاهده کرده و یادآوری پرداخت دریافت کنید. بخش‌های «صندوق‌های قرض‌الحسنه»،
          «قرعه‌کشی خانگی» و سایر دسته‌بندی‌ها به زودی اضافه خواهند شد.
        </p>
      </div>
    </div>
  );
}

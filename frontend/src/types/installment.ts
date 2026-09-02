/** Payment category types */
export type PaymentCategory =
  | "bank_facility"
  | "charity_fund"
  | "home_lottery"
  | "bill_payment"
  | "tuition"
  | "loan"
  | "other";

/** Display info for each payment category */
export interface PaymentCategoryInfo {
  id: PaymentCategory;
  title: string;
  description: string;
  icon: string;
  color: string;
}

/** Payment method for bank facilities */
export type PaymentMethodType = "card_transfer" | "account_number" | "facility_number";

export interface PaymentMethod {
  type: PaymentMethodType;
  label: string;
  value: string;
}

/** Bank facility installment record */
export interface BankFacility {
  id?: number;
  title: string;
  bank_name: string;
  total_installments: number;
  total_loan_amount: number;
  installment_amount: number;
  start_date: string;
  end_date: string;
  payment_methods: PaymentMethod[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/** Generic installment record wrapper */
export interface InstallmentRecord {
  id: number;
  category: PaymentCategory;
  title: string;
  data: BankFacility;
  created_at?: string;
  updated_at?: string;
}

/** Payment method type display labels */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  card_transfer: "کارت به کارت",
  account_number: "شماره حساب",
  facility_number: "شماره تسهیلات",
};

/** All available payment categories */
export const PAYMENT_CATEGORIES: PaymentCategoryInfo[] = [
  {
    id: "bank_facility",
    title: "تسهیلات بانکی",
    description: "ثبت اطلاعات وام‌ها و تسهیلات دریافتی از بانک‌ها",
    icon: "Landmark",
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "charity_fund",
    title: "صندوق‌های قرض‌الحسنه",
    description: "مدیریت اقساط صندوق‌های قرض‌الحسنه",
    icon: "Heart",
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "home_lottery",
    title: "قرعه‌کشی خانگی",
    description: "پیگیری اقساط قرعه‌کشی‌های خانگی",
    icon: "Trophy",
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "bill_payment",
    title: "پرداخت قبض",
    description: "مدیریت پرداخت قبوض آب، برق، گاز و تلفن",
    icon: "Receipt",
    color: "from-pink-500 to-rose-600",
  },
  {
    id: "tuition",
    title: "پرداخت شهریه",
    description: "ثبت اقساط شهریه دانشگاه یا آموزشگاه",
    icon: "GraduationCap",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "loan",
    title: "پرداخت قرض",
    description: "مدیریت اقساط قرض‌های شخصی",
    icon: "HandCoins",
    color: "from-cyan-500 to-sky-600",
  },
];

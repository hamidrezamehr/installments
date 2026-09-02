import { useMemo, useCallback } from "react";
import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js";
import CustomSelect from "./custom-select";
import type { CustomSelectOption } from "./custom-select";

const JALALI_MONTHS: CustomSelectOption[] = [
  { value: "1", label: "فروردین" },
  { value: "2", label: "اردیبهشت" },
  { value: "3", label: "خرداد" },
  { value: "4", label: "تیر" },
  { value: "5", label: "مرداد" },
  { value: "6", label: "شهریور" },
  { value: "7", label: "مهر" },
  { value: "8", label: "آبان" },
  { value: "9", label: "آذر" },
  { value: "10", label: "دی" },
  { value: "11", label: "بهمن" },
  { value: "12", label: "اسفند" },
];

const CURRENT_JALALI_YEAR = toJalaali(new Date()).jy;

// Last 10 Jalali years including current year
const YEAR_OPTIONS: CustomSelectOption[] = Array.from(
  { length: 10 },
  (_, i) => {
    const y = CURRENT_JALALI_YEAR - i;
    return { value: String(y), label: String(y) };
  },
);

/** Convert Gregorian ISO to Jalali {jy, jm, jd} or null */
function toJalaliFromISO(iso: string): {
  jy: number;
  jm: number;
  jd: number;
} | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  return toJalaali(d);
}

/** Convert Jalali to Gregorian YYYY-MM-DD */
function toISOFromJalali(jy: number, jm: number, jd: number): string {
  const g = toGregorian(jy, jm, jd);
  return `${String(g.gy).padStart(4, "0")}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;
}

interface JalaliDatePickerProps {
  value: string; // Gregorian YYYY-MM-DD or ""
  onChange: (gregorianDate: string) => void;
  required?: boolean;
}

export default function JalaliDatePicker({
  value,
  onChange,
  required,
}: JalaliDatePickerProps) {
  // Derive Jalali values directly from value prop — no sync effect needed
  const jalali = useMemo(() => toJalaliFromISO(value), [value]);
  const jy = jalali?.jy ?? "";
  const jm = jalali?.jm ?? "";
  const jd = jalali?.jd ?? "";

  // Emit a valid Gregorian date to parent
  const emit = useCallback(
    (newJy: number, newJm: number, newJd: number) => {
      const iso = toISOFromJalali(newJy, newJm, newJd);
      if (iso !== value) {
        onChange(iso);
      }
    },
    [value, onChange],
  );

  const maxDays = jy && jm ? jalaaliMonthLength(jy, jm) : 31;

  const dayOptions: CustomSelectOption[] = Array.from(
    { length: maxDays },
    (_, i) => ({ value: String(i + 1), label: String(i + 1) }),
  );

  return (
    <div className="flex items-center gap-2">
      {/* Day */}
      <CustomSelect
        value={jd === "" ? "" : String(jd)}
        options={dayOptions}
        placeholder="روز"
        onChange={(v) => {
          const n = Number(v);
          if (jy && jm && n >= 1 && n <= jalaaliMonthLength(jy, jm)) {
            emit(jy, jm, n);
          }
        }}
        required={required}
        className="w-18 shrink-0"
      />

      {/* Month */}
      <CustomSelect
        value={jm === "" ? "" : String(jm)}
        options={JALALI_MONTHS}
        placeholder="ماه"
        onChange={(v) => {
          const n = Number(v);
          if (jy && jd && n >= 1 && n <= 12) {
            const maxDay = jalaaliMonthLength(jy, n);
            emit(jy, n, jd > maxDay ? maxDay : jd);
          }
        }}
        required={required}
        className="min-w-0 flex-1"
      />

      {/* Year */}
      <CustomSelect
        value={jy === "" ? "" : String(jy)}
        options={YEAR_OPTIONS}
        placeholder="سال"
        onChange={(v) => {
          const n = Number(v);
          if (jm && jd) {
            const maxDay = jalaaliMonthLength(n, jm);
            emit(n, jm, jd > maxDay ? maxDay : jd);
          }
        }}
        required={required}
        className="w-24 shrink-0"
      />
    </div>
  );
}

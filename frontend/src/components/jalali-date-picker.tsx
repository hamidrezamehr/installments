import { useMemo, useCallback, useState } from "react";
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

interface PartialDate {
  day: number | "";
  month: number | "";
  year: number | "";
}

const EMPTY_PARTIAL: PartialDate = { day: "", month: "", year: "" };

export default function JalaliDatePicker({
  value,
  onChange,
  required,
}: JalaliDatePickerProps) {
  // Derive Jalali from parent's value prop (Edit mode)
  const jalali = useMemo(() => toJalaliFromISO(value), [value]);

  // Internal state for partial selections (Add mode when value is empty)
  const [partial, setPartial] = useState<PartialDate>(EMPTY_PARTIAL);

  // Display: prefer value prop (Edit), fall back to internal state (Add)
  const jy = jalali?.jy ?? partial.year;
  const jm = jalali?.jm ?? partial.month;
  const jd = jalali?.jd ?? partial.day;

  // Emit complete Gregorian date to parent
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

  function handleDayChange(v: string) {
    const n = Number(v);
    if (jalali) {
      // Edit mode: emit directly
      if (n >= 1 && n <= jalaaliMonthLength(jalali.jy, jalali.jm)) {
        emit(jalali.jy, jalali.jm, n);
      }
    } else {
      // Add mode: store partial, emit when complete
      setPartial((prev) => {
        const next = { ...prev, day: n };
        if (next.year && next.month) {
          const maxDay = jalaaliMonthLength(next.year, next.month);
          const clampedDay = n > maxDay ? maxDay : n;
          emit(next.year, next.month, clampedDay);
          return { ...next, day: clampedDay };
        }
        return next;
      });
    }
  }

  function handleMonthChange(v: string) {
    const n = Number(v);
    if (jalali) {
      // Edit mode: emit directly
      if (n >= 1 && n <= 12) {
        const maxDay = jalaaliMonthLength(jalali.jy, n);
        const clampedDay = jd && jd > maxDay ? maxDay : (jd || 1);
        emit(jalali.jy, n, clampedDay);
      }
    } else {
      // Add mode: store partial, clamp day, emit when complete
      setPartial((prev) => {
        const maxDay = prev.year ? jalaaliMonthLength(prev.year, n) : 31;
        let clampedDay: number | "" = prev.day;
        if (prev.day && prev.day > maxDay) clampedDay = maxDay;
        const next = { ...prev, month: n, day: clampedDay };
        if (next.year && typeof clampedDay === "number") {
          emit(next.year, n, clampedDay);
        }
        return next;
      });
    }
  }

  function handleYearChange(v: string) {
    const n = Number(v);
    if (jalali) {
      // Edit mode: emit directly
      const maxDay = jalaaliMonthLength(n, jalali.jm);
      const clampedDay = jd && jd > maxDay ? maxDay : (jd || 1);
      emit(n, jalali.jm, clampedDay);
    } else {
      // Add mode: store partial, clamp day, emit when complete
      setPartial((prev) => {
        const maxDay = prev.month ? jalaaliMonthLength(n, prev.month) : 31;
        let clampedDay: number | "" = prev.day;
        if (prev.day && prev.day > maxDay) clampedDay = maxDay;
        const next = { ...prev, year: n, day: clampedDay };
        if (next.month && typeof clampedDay === "number") {
          emit(n, next.month, clampedDay);
        }
        return next;
      });
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Day */}
      <CustomSelect
        value={jd === "" ? "" : String(jd)}
        options={dayOptions}
        placeholder="روز"
        onChange={handleDayChange}
        required={required}
        className="w-18 shrink-0"
      />

      {/* Month */}
      <CustomSelect
        value={jm === "" ? "" : String(jm)}
        options={JALALI_MONTHS}
        placeholder="ماه"
        onChange={handleMonthChange}
        required={required}
        className="min-w-0 flex-1"
      />

      {/* Year */}
      <CustomSelect
        value={jy === "" ? "" : String(jy)}
        options={YEAR_OPTIONS}
        placeholder="سال"
        onChange={handleYearChange}
        required={required}
        className="w-24 shrink-0"
      />
    </div>
  );
}

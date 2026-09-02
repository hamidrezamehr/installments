import { useMemo, useCallback } from "react";
import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js";

const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const CURRENT_JALALI_YEAR = toJalaali(new Date()).jy;

/** Convert a Gregorian YYYY-MM-DD string to Jalali {jy, jm, jd} or null */
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

/** Convert Jalali {jy, jm, jd} to Gregorian YYYY-MM-DD string */
function toISOFromJalali(jy: number, jm: number, jd: number): string {
  const g = toGregorian(jy, jm, jd);
  const yyyy = String(g.gy).padStart(4, "0");
  const mm = String(g.gm).padStart(2, "0");
  const dd = String(g.gd).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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
  // Derive Jalali values directly from the value prop — no sync effect needed
  const jalali = useMemo(() => toJalaliFromISO(value), [value]);
  const jy = jalali?.jy ?? "";
  const jm = jalali?.jm ?? "";
  const jd = jalali?.jd ?? "";

  // Emit a new Gregorian date to the parent when the user selects a valid date
  const emit = useCallback(
    (newJy: number, newJm: number, newJd: number) => {
      const iso = toISOFromJalali(newJy, newJm, newJd);
      if (iso !== value) {
        onChange(iso);
      }
    },
    [value, onChange],
  );

  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const raw = e.target.value;
    if (raw === "") {
      // Cannot clear year — treat as no-op
      return;
    }
    const newJy = Number(raw);
    if (isNaN(newJy)) return;

    if (jm && jd) {
      const maxDay = jalaaliMonthLength(newJy, jm);
      const clampedDay = jd > maxDay ? maxDay : jd;
      emit(newJy, jm, clampedDay);
    }
    // If month or day is empty, emit just the year by keeping them —
    // the parent value won't change until all three are set.
  }

  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const raw = e.target.value;
    if (raw === "") {
      // Cannot clear month — treat as no-op
      return;
    }
    const newJm = Number(raw);
    if (isNaN(newJm) || newJm < 1 || newJm > 12) return;

    if (jy && jd) {
      const maxDay = jalaaliMonthLength(jy, newJm);
      const clampedDay = jd > maxDay ? maxDay : jd;
      emit(jy, newJm, clampedDay);
    }
  }

  function handleDayChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const raw = e.target.value;
    if (raw === "") {
      // Cannot clear day — treat as no-op
      return;
    }
    const newJd = Number(raw);
    if (isNaN(newJd)) return;

    if (jy && jm) {
      const maxDay = jalaaliMonthLength(jy, jm);
      if (newJd < 1 || newJd > maxDay) return;
      emit(jy, jm, newJd);
    }
  }

  // Compute the max number of days for the current year/month
  const maxDays = jy && jm ? jalaaliMonthLength(jy, jm) : 31;

  const dayOptions = Array.from({ length: maxDays }, (_, i) => i + 1);

  const yearOptions = Array.from(
    { length: 30 },
    (_, i) => CURRENT_JALALI_YEAR - 29 + i,
  );

  const selectClass =
    "rounded-lg border border-black/10 bg-white px-4 py-2.5 text-base font-medium text-gray-900 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20";

  return (
    <div className="flex items-center gap-2">
      {/* Day */}
      <select
        value={jd}
        onChange={handleDayChange}
        required={required}
        className={`${selectClass} w-18 shrink-0 text-center`}
      >
        <option value="">روز</option>
        {dayOptions.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      {/* Month */}
      <select
        value={jm}
        onChange={handleMonthChange}
        required={required}
        className={`${selectClass} min-w-0 flex-1`}
      >
        <option value="">ماه</option>
        {JALALI_MONTHS.map((name, i) => (
          <option key={i + 1} value={i + 1}>
            {name}
          </option>
        ))}
      </select>

      {/* Year */}
      <select
        value={jy}
        onChange={handleYearChange}
        required={required}
        className={`${selectClass} w-24 shrink-0 text-center`}
      >
        <option value="">سال</option>
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

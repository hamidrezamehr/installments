import { useState, useEffect } from "react";
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
  const [jy, setJy] = useState<number | "">("");
  const [jm, setJm] = useState<number | "">("");
  const [jd, setJd] = useState<number | "">("");

  // Initialize from Gregorian value prop
  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      if (!isNaN(d.getTime())) {
        const j = toJalaali(d);
        setJy(j.jy);
        setJm(j.jm);
        setJd(j.jd);
        return;
      }
    }
    setJy("");
    setJm("");
    setJd("");
  }, [value]);

  function handleChange(
    field: "y" | "m" | "d",
    raw: string,
  ) {
    if (raw === "") {
      if (field === "y") setJy("");
      else if (field === "m") setJm("");
      else setJd("");
      return;
    }

    const num = Number(raw);
    if (isNaN(num)) return;

    if (field === "y") {
      setJy(num);
    } else if (field === "m") {
      if (num < 1 || num > 12) return;
      setJm(num);
      // Clamp day if new month has fewer days
      if (jd) {
        const max = jalaaliMonthLength(jy || CURRENT_JALALI_YEAR, num);
        if (jd > max) setJd(max);
      }
    } else {
      if (num < 1 || num > (jy && jm ? jalaaliMonthLength(jy, jm) : 31))
        return;
      setJd(num);
    }
  }

  // When year or month changes, clamp the day
  useEffect(() => {
    if (jy && jm && jd) {
      const max = jalaaliMonthLength(jy, jm);
      if (jd > max) setJd(max);
    }
  }, [jy, jm, jd]);

  // Emit Gregorian date when all three are selected
  useEffect(() => {
    if (jy && jm && jd) {
      try {
        const g = toGregorian(jy, jm, jd);
        const yyyy = String(g.gy).padStart(4, "0");
        const mm = String(g.gm).padStart(2, "0");
        const dd = String(g.gd).padStart(2, "0");
        const iso = `${yyyy}-${mm}-${dd}`;
        if (iso !== value) {
          onChange(iso);
        }
      } catch {
        // invalid date, do not emit
      }
    }
  }, [jy, jm, jd]); // eslint-disable-line react-hooks/exhaustive-deps

  const yearOptions = Array.from(
    { length: 30 },
    (_, i) => CURRENT_JALALI_YEAR - 29 + i,
  );

  const dayOptions =
    jy && jm
      ? Array.from({ length: jalaaliMonthLength(jy, jm) }, (_, i) => i + 1)
      : Array.from({ length: 31 }, (_, i) => i + 1);

  const selectClass =
    "rounded-lg border border-black/10 bg-white px-4 py-2.5 text-base font-medium text-gray-900 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20";

  return (
    <div className="flex items-center gap-2">
      {/* Day */}
      <select
        value={jd}
        onChange={(e) => handleChange("d", e.target.value)}
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
        onChange={(e) => handleChange("m", e.target.value)}
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
        onChange={(e) => handleChange("y", e.target.value)}
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

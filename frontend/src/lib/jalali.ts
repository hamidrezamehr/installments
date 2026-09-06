import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js";

/** Convert Gregorian YYYY-MM-DD to Jalali {jy,jm,jd} */
export function isoToJalali(iso: string): { jy: number; jm: number; jd: number } | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  return toJalaali(d);
}

/** Convert Gregorian date string to Jalali display string */
export function formatJalaliDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00"));
    if (isNaN(d.getTime())) return dateStr;
    const j = toJalaali(d);
    return `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")}`;
  } catch {
    return dateStr;
  }
}

/** Add N months to a Jalali date, clamping day to max valid day */
export function addJalaliMonths(
  jy: number,
  jm: number,
  jd: number,
  months: number,
): { jy: number; jm: number; jd: number } {
  const totalMonths = jy * 12 + (jm - 1) + months;
  const newJy = Math.floor(totalMonths / 12);
  const newJm = (totalMonths % 12) + 1;
  const maxDay = jalaaliMonthLength(newJy, newJm);
  const newJd = jd > maxDay ? maxDay : jd;
  return { jy: newJy, jm: newJm, jd: newJd };
}

/** Convert Jalali date to Gregorian YYYY-MM-DD */
export function jalaliToISO(jy: number, jm: number, jd: number): string {
  const g = toGregorian(jy, jm, jd);
  return `${String(g.gy).padStart(4, "0")}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;
}

/** Get today's date as Gregorian YYYY-MM-DD */
export function getTodayISO(): string {
  const now = new Date();
  return `${String(now.getFullYear()).padStart(4, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Check if a Gregorian date is in the past (overdue) */
export function isOverdue(dueDateISO: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dueDateISO + "T00:00:00");
  return today >= dueDate;
}

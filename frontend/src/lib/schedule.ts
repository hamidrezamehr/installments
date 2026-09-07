import type { InstallmentPayment } from "../types/installment";
import { isoToJalali, addJalaliMonths, isOverdue, jalaliToISO } from "./jalali";

export interface ScheduleItem {
  index: number;
  dueDateJalali: string;
  dueDateGregorian: string;
  due: boolean;
  paid: boolean;
  payment?: InstallmentPayment;
}

/** Build payment schedule from installment data + DB payments */
export function buildSchedule(
  startDate: string,
  totalInstallments: number,
  payments: InstallmentPayment[],
): ScheduleItem[] {
  const jalaliStart = isoToJalali(startDate);
  if (!jalaliStart) return [];

  // Create a map of installment_number → payment for quick lookup
  const paymentMap = new Map<number, InstallmentPayment>();
  payments.forEach((p) => paymentMap.set(p.installment_number, p));

  const schedule: ScheduleItem[] = [];
  for (let i = 0; i < totalInstallments; i++) {
    const due = addJalaliMonths(
      jalaliStart.jy,
      jalaliStart.jm,
      jalaliStart.jd,
      i,
    );
    const dueIso = jalaliToISO(due.jy, due.jm, due.jd);
    const installmentNumber = i + 1;

    schedule.push({
      index: installmentNumber,
      dueDateJalali: `${due.jy}/${String(due.jm).padStart(2, "0")}/${String(due.jd).padStart(2, "0")}`,
      dueDateGregorian: dueIso,
      due: isOverdue(dueIso),
      paid: paymentMap.has(installmentNumber),
      payment: paymentMap.get(installmentNumber),
    });
  }
  return schedule;
}

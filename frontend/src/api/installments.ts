import api, { extractApiErrorMessage } from "../api";
import type { BankFacility, InstallmentRecord, InstallmentPayment } from "../types/installment";

/** Create a new bank facility installment */
export async function createBankFacility(data: BankFacility): Promise<InstallmentRecord> {
  const response = await api.post<InstallmentRecord>("/installments/bank-facility", data);
  return response.data;
}

/** Get all installments for the current user */
export async function getInstallments(): Promise<InstallmentRecord[]> {
  const response = await api.get<InstallmentRecord[]>("/installments");
  return response.data;
}

/** Get a single installment by ID (includes payments array) */
export async function getInstallment(id: number): Promise<InstallmentRecord> {
  const response = await api.get<InstallmentRecord>(`/installments/${id}`);
  return response.data;
}

/** Update an existing bank facility */
export async function updateBankFacility(
  id: number,
  data: BankFacility,
): Promise<InstallmentRecord> {
  const response = await api.put<InstallmentRecord>(
    `/installments/${id}`,
    data,
  );
  return response.data;
}

/** Delete an installment */
export async function deleteInstallment(id: number): Promise<void> {
  await api.delete(`/installments/${id}`);
}

/** Store payment for an installment with details */
export async function storePayment(
  installmentId: number,
  installmentNumber: number,
  paymentMethod: string,
  paymentDate: string,
  note?: string,
): Promise<{ paid: boolean; message: string; payment: InstallmentPayment }> {
  const response = await api.post<{ paid: boolean; message: string; payment: InstallmentPayment }>(
    `/installments/${installmentId}/payments`,
    {
      installment_number: installmentNumber,
      payment_method: paymentMethod,
      payment_date: paymentDate,
      note: note || null,
    },
  );
  return response.data;
}

/** Delete payment for an installment (unpay) */
export async function deletePayment(
  installmentId: number,
  installmentNumber: number,
): Promise<{ paid: boolean; message: string }> {
  const response = await api.delete<{ paid: boolean; message: string }>(
    `/installments/${installmentId}/payments/${installmentNumber}`,
  );
  return response.data;
}

export { extractApiErrorMessage };

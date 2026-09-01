import api from "../api";
import type { BankFacility, InstallmentRecord } from "../types/installment";

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

/** Get a single installment by ID */
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

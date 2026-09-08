import api, { TOKEN_STORAGE_KEY, extractApiErrorMessage } from "../api";
import type { BankFacility, InstallmentRecord } from "../types/installment";

/** Create a new bank facility installment */
export async function createBankFacility(
  data: Omit<BankFacility, "id" | "created_at" | "updated_at">,
): Promise<InstallmentRecord> {
  const response = await api.post<InstallmentRecord>("/installments", {
    category: "bank_facility",
    title: data.title,
    data,
  });
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
  data: Omit<BankFacility, "id" | "created_at" | "updated_at">,
): Promise<InstallmentRecord> {
  const response = await api.put<InstallmentRecord>(`/installments/${id}`, {
    category: "bank_facility",
    title: data.title,
    data,
  });
  return response.data;
}

/** Delete an installment */
export async function deleteInstallment(id: number): Promise<void> {
  await api.delete(`/installments/${id}`);
}

/** True when the user has an auth token stored (optimistic, server verifies). */
export function hasStoredToken(): boolean {
  return Boolean(localStorage.getItem(TOKEN_STORAGE_KEY));
}

export { extractApiErrorMessage };

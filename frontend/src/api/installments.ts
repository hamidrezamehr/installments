// Re-export from new service layer for backward compatibility
export {
  getInstallments,
  getInstallment,
  createInstallment as createBankFacility,
  updateInstallment as updateBankFacility,
  deleteInstallment,
  storePayment,
  deletePayment,
} from "../services/installment-api";

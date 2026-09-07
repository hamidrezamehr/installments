/** Format a number as Persian currency with ریال suffix */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
}

/** Format card number as XXXX-XXXX-XXXX-XXXX */
export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}

/** Strip dashes and non-digits from card value */
export function cardDigits(raw: string): string {
  return raw.replace(/[^0-9]/g, "").slice(0, 16);
}

/** Format a number with comma separators for display */
export function formatWithCommas(n: number | ""): string {
  if (n === "" || n === 0) return "";
  return n.toLocaleString("en-US");
}

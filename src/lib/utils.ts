export { cn } from "cn";

// Zero-pads a number to match the digit count of the largest expected value (e.g. 001, 023, 100).
export function formatPaddedNumber(value: number, referenceMax: number): string {
  const digitCount = Math.max(1, String(Math.max(referenceMax, 0)).length);
  return String(value).padStart(digitCount, "0");
}

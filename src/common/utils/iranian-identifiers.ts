/** Normalize Persian/Arabic digits and common Iranian phone representations. */
export function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632));
}

export function normalizeNationalId(value: string): string {
  return toEnglishDigits(value).replace(/\D/g, '');
}

export function normalizeIranianPhone(value: string): string {
  const digits = toEnglishDigits(value).replace(/\D/g, '');
  if (digits.startsWith('98')) return `+${digits}`;
  if (digits.startsWith('0')) return `+98${digits.slice(1)}`;
  if (digits.startsWith('9')) return `+98${digits}`;
  return value;
}

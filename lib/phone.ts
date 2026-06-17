export function formatPhoneInput(value: string, prevDigitCount?: number): string {
  let digits = value.replace(/\D/g, "");

  // If digit count didn't change but string did, user deleted a formatting char → remove a digit
  if (prevDigitCount !== undefined && digits.length === prevDigitCount && digits.length > 0) {
    digits = digits.slice(0, -1);
  }

  if (!digits) return "";

  // +X
  let result = `+${digits[0]}`;
  // +X(XXX
  if (digits.length > 1) result += `(${digits.slice(1, 4)}`;
  // +X(XXX)XXX
  if (digits.length >= 4) result += `)${digits.slice(4, 7)}`;
  // +X(XXX)XXX-XX  (only if there are digits at positions 7-8)
  if (digits.length > 7) result += `-${digits.slice(7, 9)}`;
  // +X(XXX)XXX-XX-XX  (only if there are digits at position 9+)
  if (digits.length > 9) result += `-${digits.slice(9)}`;

  return result;
}

export function hasValidPhoneLength(value: string): boolean {
  const len = value.replace(/\D/g, "").length;
  return len >= 7 && len <= 11;
}

export function hasMinPhoneDigits(value: string): boolean {
  return hasValidPhoneLength(value);
}

// kept for compatibility
export function formatRussianPhoneInput(value: string): string {
  return formatPhoneInput(value);
}

export function hasValidRussianPhoneDigits(value: string): boolean {
  return value.replace(/\D/g, "").length === 11;
}

export function getPhoneDigitsCount(value: string): number {
  return value.replace(/\D/g, "").length;
}

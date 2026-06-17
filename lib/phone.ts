function normalizeRussianPhoneDigits(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("8")) {
    return `7${digits.slice(1)}`.slice(0, 11);
  }

  if (digits.startsWith("7")) {
    return digits.slice(0, 11);
  }

  return `7${digits}`.slice(0, 11);
}

export function formatRussianPhoneInput(value: string): string {
  const digits = normalizeRussianPhoneDigits(value);

  if (!digits) {
    return "";
  }

  if (digits.length === 1) {
    return "+7";
  }

  const country = "+7";
  const area = digits.slice(1, 4);
  const first = digits.slice(4, 7);
  const second = digits.slice(7, 9);
  const third = digits.slice(9, 11);

  let formatted = country;

  if (area) {
    formatted += `(${area}`;
  }

  if (digits.length >= 4) {
    formatted += ")";
  }

  if (first) {
    formatted += first;
  }

  if (second) {
    formatted += `-${second}`;
  }

  if (third) {
    formatted += `-${third}`;
  }

  return formatted;
}

export function hasValidRussianPhoneDigits(value: string): boolean {
  const rawDigits = value.replace(/\D/g, "");

  if (rawDigits.length !== 11) {
    return false;
  }

  const digits = normalizeRussianPhoneDigits(value);
  return digits.length === 11 && digits.startsWith("7");
}

export function getPhoneDigitsCount(value: string): number {
  return value.replace(/\D/g, "").length;
}

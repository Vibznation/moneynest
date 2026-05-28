import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

export function formatCurrencyPrecise(value: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

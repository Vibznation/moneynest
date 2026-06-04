/**
 * Schedules local browser notifications for upcoming bills.
 * Called after notification permission is granted.
 * Uses setTimeout for same-session reminders (< 24h away).
 */

interface BillLike {
  id: string;
  name: string;
  due_date: string; // ISO date string
  amount: number;
}

const REMINDER_KEY = "dueviq:reminder-timers";

export function scheduleBillReminders(bills: BillLike[], currency: string = "USD") {
  if (typeof window === "undefined") return;
  if (Notification.permission !== "granted") return;

  // Clear old scheduled timer IDs (we can't cancel them, but we track to avoid duplicate logic)
  const now = Date.now();

  bills.forEach((bill) => {
    const due = new Date(bill.due_date);
    due.setHours(9, 0, 0, 0); // Remind at 9am on due day
    const ms = due.getTime() - now;

    if (ms <= 0 || ms > 48 * 60 * 60 * 1000) return; // Only schedule if within 48h

    const key = `${REMINDER_KEY}:${bill.id}`;
    if (sessionStorage.getItem(key)) return; // Already scheduled this session
    sessionStorage.setItem(key, "1");

    setTimeout(() => {
      const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency }).format(bill.amount);
      new Notification(`Bill due today: ${bill.name}`, {
        body: `${fmt} is due today. Tap to review.`,
        icon: "/icon-192.png",
        tag: `bill-${bill.id}`,
        data: { url: "/bills" },
      });
    }, ms);
  });
}

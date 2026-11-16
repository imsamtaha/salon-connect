type TelegramResponse = { ok: boolean; description?: string; result?: unknown };

type BookingMessage = {
  bookingId: string;
  chatId?: string;
  customerName: string;
  salonName: string;
  serviceName: string;
  appointmentAt?: string;
  appointmentAtLabel?: string;
  staffName: string;
};

const sentApprovalNotifications = new Set<string>();
const sentReminderNotifications = new Set<string>();

async function sendTelegramText(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { delivered: false, duplicate: false, reason: "telegram_not_configured" as const };
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text }), signal: AbortSignal.timeout(15_000) });
  const payload = (await response.json()) as TelegramResponse;
  if (!response.ok || !payload.ok) return { delivered: false, duplicate: false, reason: "telegram_delivery_failed" as const, description: payload.description };
  return { delivered: true, duplicate: false, reason: "sent" as const };
}

export function hasSentApprovalNotification(bookingId: string) { return sentApprovalNotifications.has(bookingId); }

export async function sendBookingApprovalNotification(input: BookingMessage) {
  const chatId = input.chatId ?? process.env.TELEGRAM_DEFAULT_CHAT_ID;
  if (!chatId) return { delivered: false, duplicate: false, reason: "telegram_not_configured" as const };
  if (sentApprovalNotifications.has(input.bookingId)) return { delivered: false, duplicate: true, reason: "already_sent" as const };
  const text = [`مرحباً ${input.customerName}، تمت الموافقة على موعدك ✅`, "", `الصالون: ${input.salonName}`, `الخدمة: ${input.serviceName}`, `الموظف: ${input.staffName}`, `الموعد: ${input.appointmentAt ?? input.appointmentAtLabel ?? ""}`, "", "نراك قريباً. يمكنك الرد على هذه المحادثة لإرسال ملاحظة للصالون."].join("\n");
  const result = await sendTelegramText(chatId, text);
  if (result.delivered) sentApprovalNotifications.add(input.bookingId);
  return result;
}

export async function sendBookingReminderNotification(input: BookingMessage) {
  const chatId = input.chatId ?? process.env.TELEGRAM_DEFAULT_CHAT_ID;
  if (!chatId) return { delivered: false, duplicate: false, reason: "telegram_not_configured" as const };
  if (sentReminderNotifications.has(input.bookingId)) return { delivered: false, duplicate: true, reason: "already_sent" as const };
  const text = [`تذكير بموعدك ⏰`, "", `الصالون: ${input.salonName}`, `الخدمة: ${input.serviceName}`, `الموظف: ${input.staffName}`, `الموعد: ${input.appointmentAtLabel ?? input.appointmentAt ?? ""}`, "", "ننتظرك بكل سرور."].join("\n");
  const result = await sendTelegramText(chatId, text);
  if (result.delivered) sentReminderNotifications.add(input.bookingId);
  return result;
}

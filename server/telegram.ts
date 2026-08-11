type TelegramResponse = { ok: boolean; description?: string; result?: unknown };

type ApprovalNotification = {
  bookingId: string;
  chatId?: string;
  customerName: string;
  salonName: string;
  serviceName: string;
  appointmentAt: string;
  staffName: string;
};

const sentApprovalNotifications = new Set<string>();

export function hasSentApprovalNotification(bookingId: string) {
  return sentApprovalNotifications.has(bookingId);
}

export async function sendBookingApprovalNotification(input: ApprovalNotification) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = input.chatId ?? process.env.TELEGRAM_DEFAULT_CHAT_ID;
  if (!token || !chatId) {
    return { delivered: false, duplicate: false, reason: "telegram_not_configured" as const };
  }

  if (sentApprovalNotifications.has(input.bookingId)) {
    return { delivered: false, duplicate: true, reason: "already_sent" as const };
  }

  const text = [
    `مرحباً ${input.customerName}، تمت الموافقة على موعدك ✅`,
    "",
    `الصالون: ${input.salonName}`,
    `الخدمة: ${input.serviceName}`,
    `الموظف: ${input.staffName}`,
    `الموعد: ${input.appointmentAt}`,
    "",
    "نراك قريباً. يمكنك الرد على هذه المحادثة لإرسال ملاحظة للصالون.",
  ].join("\\n");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  const payload = (await response.json()) as TelegramResponse;
  if (!response.ok || !payload.ok) {
    return { delivered: false, duplicate: false, reason: "telegram_delivery_failed" as const, description: payload.description };
  }

  sentApprovalNotifications.add(input.bookingId);
  return { delivered: true, duplicate: false, reason: "sent" as const };
}

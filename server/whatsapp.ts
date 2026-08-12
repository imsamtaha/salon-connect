export type WhatsAppDeliveryResult =
  | { delivered: false; duplicate: false; reason: "whatsapp_not_configured" }
  | { delivered: false; duplicate: false; reason: "whatsapp_delivery_failed"; description?: string }
  | { delivered: false; duplicate: true; reason: "already_sent" }
  | { delivered: true; duplicate: false; reason: "sent" };

type WhatsAppMessage = {
  recipientPhone?: string;
  text: string;
};

/**
 * Optional WhatsApp Business adapter.
 * The UI may offer WhatsApp as a customer preference, but delivery stays disabled
 * until a verified WhatsApp Business provider and credentials are configured.
 */
export async function sendWhatsAppText(input: WhatsAppMessage): Promise<WhatsAppDeliveryResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId || !input.recipientPhone) {
    return { delivered: false, duplicate: false, reason: "whatsapp_not_configured" };
  }

  // Provider-specific template and recipient policy will be added when WhatsApp Business is enabled.
  return { delivered: false, duplicate: false, reason: "whatsapp_not_configured" };
}

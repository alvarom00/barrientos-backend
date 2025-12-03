import Brevo from "@getbrevo/brevo";

const apiKey = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.MAIL_FROM || "no-reply@camposbarrientos.com";
const FROM_NAME = process.env.MAIL_FROM_NAME || "Campos Barrientos";

if (!apiKey) {
  throw new Error("❌ Falta BREVO_API_KEY en variables de entorno");
}

const client = new Brevo.TransactionalEmailsApi();
client.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

export type SendParams = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: SendParams) {
  const msg = {
    sender: { email: FROM_EMAIL, name: FROM_NAME },
    to: Array.isArray(to)
      ? to.map((email) => ({ email }))
      : [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text,
    replyTo: replyTo ? { email: replyTo } : undefined,
  };

  try {
    const resp = await client.sendTransacEmail(msg);

    const messageId = resp?.body?.messageId;

    console.log("📨 Brevo OK:", messageId);

    return { ok: true, messageId };
  } catch (err: any) {
    const detail = err?.response?.body || err;
    console.error("❌ Brevo error:", detail);
    throw err;
  }
}

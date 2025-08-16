// src/utils/sendEmail.ts
import sgMail from "@sendgrid/mail";

const KEY = process.env.SENDGRID_API_KEY;
const FROM = process.env.MAIL_FROM;

if (!KEY) {
  console.error("❌ FALTA SENDGRID_API_KEY en el entorno");
}
if (!FROM) {
  console.error("❌ FALTA MAIL_FROM en el entorno");
}

sgMail.setApiKey(KEY || "");

type SendParams = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendEmail({ to, subject, html, replyTo }: SendParams) {
  const msg: any = {
    to,
    from: FROM!,
    subject,
    html,
  };
  if (replyTo) msg.replyTo = replyTo;

  try {
    const [resp] = await sgMail.send(msg);
    console.log("📨 SendGrid OK", resp.statusCode, resp.headers["x-message-id"] || resp.headers["x-sg-id"]);
    return { ok: true };
  } catch (err: any) {
    // SendGrid devuelve info útil en err.response.body
    const body = err?.response?.body;
    if (body) {
      console.error("❌ SendGrid error body:", JSON.stringify(body));
    } else {
      console.error("❌ SendGrid error:", err?.message || err);
    }
    throw err;
  }
}

import sgMail, { MailDataRequired } from "@sendgrid/mail";

const API_KEY     = process.env.SENDGRID_API_KEY;
const FROM_EMAIL  = process.env.MAIL_FROM || "no-reply@camposbarrientos.com";
const FROM_NAME   = process.env.MAIL_FROM_NAME || "Campos Barrientos";

if (!API_KEY) {
  console.error("❌ Falta SENDGRID_API_KEY en las variables de entorno");
} else {
  sgMail.setApiKey(API_KEY);
}

export type SendParams = {
  to: string | string[];   // admite uno o varios destinatarios
  subject: string;
  html: string;
  text?: string;           // opcional: versión texto plano
  replyTo?: string;        // opcional: para poder responder al remitente real
  sandbox?: boolean;       // opcional: modo sandbox para pruebas (no envía)
};

export async function sendEmail({ to, subject, html, text, replyTo, sandbox }: SendParams) {
  if (!API_KEY) throw new Error("SENDGRID_API_KEY no configurada");

  const msg: MailDataRequired = {
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject,
    html,
    ...(text ? { text } : {}),
    ...(replyTo ? { replyTo } : {}),
    ...(sandbox ? { mailSettings: { sandboxMode: { enable: true } } } : {}),
  };

  try {
    const [resp] = await sgMail.send(msg);
    const id = resp.headers["x-message-id"] || resp.headers["x-sg-id"];
    console.log("📨 SendGrid OK", resp.statusCode, id);
    return { ok: true, status: resp.statusCode, id };
  } catch (err: any) {
    const body = err?.response?.body;
    console.error("❌ SendGrid error:", body ? JSON.stringify(body) : err?.message || err);
    throw err;
  }
}

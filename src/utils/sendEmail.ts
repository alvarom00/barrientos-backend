import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const msg = {
    to,
    from: process.env.MAIL_FROM!, // remitente
    subject,
    html,
  };
  await sgMail.send(msg);
}

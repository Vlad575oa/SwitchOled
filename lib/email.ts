import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure = process.env.SMTP_SECURE !== "false";
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

const fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser || "no-reply@example.com";
const fromName = process.env.SMTP_FROM_NAME || "Nintendo Shop";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error("SMTP env vars are not fully configured");
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  return transporter;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const transport = getTransporter();
  await transport.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
}

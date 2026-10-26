/**
 * Optional email delivery through Resend (https://resend.com). It stays off
 * until both RESEND_API_KEY and EMAIL_FROM are set; until then every flow that
 * would send an email returns the one-time link so an admin can share it.
 */

export function isEmailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<{ sent: boolean }> {
  if (!isEmailEnabled()) return { sent: false };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });
    if (!res.ok) {
      console.error("[email] Resend responded", res.status, await res.text().catch(() => ""));
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email] send failed", err);
    return { sent: false };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout(title: string, paragraphs: string[], link: string, linkLabel: string): string {
  const body = paragraphs.map((p) => `<p style="margin:0 0 12px">${escapeHtml(p)}</p>`).join("");
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1e293b;max-width:560px;margin:0 auto;padding:24px">
<h2 style="color:#00626b;margin:0 0 16px">${escapeHtml(title)}</h2>${body}
<p style="margin:20px 0"><a href="${escapeHtml(link)}" style="background:#00626b;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">${escapeHtml(linkLabel)}</a></p>
<p style="font-size:12px;color:#64748b">${escapeHtml(link)}</p>
<p style="font-size:12px;color:#64748b">Bio-Dosha-12</p></body></html>`;
}

export function inviteEmail(opts: { link: string; inviterName?: string; organizationName?: string; roleLabel: string }) {
  const where = opts.organizationName ? `«${opts.organizationName}»` : "Bio-Dosha-12";
  const subject = `Bio-Dosha-12: ${where} урилга · invitation`;
  const mn = [
    `Таныг ${where}-д ${opts.roleLabel} эрхтэйгээр урьж байна.`,
    "Доорх холбоосоор орж бүртгэлээ үүсгэнэ үү. Холбоос 7 хоногийн дараа хүчингүй болно.",
  ];
  const en = [`You have been invited to ${where} as ${opts.roleLabel}.`, "Open the link below to set up your account. It expires in 7 days."];
  const text = [...mn, "", ...en, "", opts.link].join("\n");
  return { subject, text, html: layout("Урилга · Invitation", [...mn, ...en], opts.link, "Урилга хүлээн авах · Accept") };
}

export function resetEmail(opts: { link: string }) {
  const subject = "Bio-Dosha-12: нууц үг сэргээх · password reset";
  const mn = ["Нууц үгээ шинэчлэх холбоос.", "Холбоос 2 цагийн дараа хүчингүй болно. Та хүсээгүй бол энэ захидлыг үл тоомсорлоно уу."];
  const en = ["Here is your password reset link.", "It expires in 2 hours. If you did not ask for it, ignore this email."];
  const text = [...mn, "", ...en, "", opts.link].join("\n");
  return { subject, text, html: layout("Нууц үг сэргээх · Password reset", [...mn, ...en], opts.link, "Нууц үг шинэчлэх · Reset") };
}

/** Tells the person about a security change made to their account by platform staff. */
export function mfaResetNoticeEmail(opts: { loginLink: string }) {
  const subject = "Bio-Dosha-12: 2 шаттай нэвтрэлт шинэчлэгдлээ · 2-step sign-in was reset";
  const mn = [
    "Таны бүртгэлийн 2 шаттай нэвтрэлтийг платформын ажилтан таны хүсэлтээр шинэчиллээ.",
    "Дараагийн нэвтрэлтэд шинэ баталгаажуулах апп холбоно. Та ийм хүсэлт гаргаагүй бол яаралтай бидэнтэй холбогдоно уу.",
  ];
  const en = [
    "Platform staff reset the 2-step sign-in of your account at your request.",
    "You will connect an authenticator app again at your next sign-in. If you did not ask for this, contact us immediately.",
  ];
  const text = [...mn, "", ...en, "", opts.loginLink].join("\n");
  return { subject, text, html: layout("2 шаттай нэвтрэлт · 2-step sign-in", [...mn, ...en], opts.loginLink, "Нэвтрэх · Sign in") };
}

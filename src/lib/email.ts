const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export async function sendQualifiedLeadEmail(payload: {
  name: string;
  email: string;
  phone: string;
  serviceNeeded: string;
  budget: string;
  preferredAppointmentDate: string;
  conversationId?: string;
}): Promise<{ ok: boolean; skippedReason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.NOTIFY_EMAIL;

  if (!apiKey || !from || !to) {
    return {
      ok: false,
      skippedReason:
        "Email not configured (RESEND_API_KEY, RESEND_FROM_EMAIL, NOTIFY_EMAIL).",
    };
  }

  const html = `
    <h2>New qualified lead</h2>
    <table style="border-collapse:collapse;font-family:sans-serif;">
      <tr><td style="padding:6px 12px;border:1px solid #eee;"><strong>Name</strong></td><td style="padding:6px 12px;border:1px solid #eee;">${escapeHtml(payload.name)}</td></tr>
      <tr><td style="padding:6px 12px;border:1px solid #eee;"><strong>Email</strong></td><td style="padding:6px 12px;border:1px solid #eee;">${escapeHtml(payload.email)}</td></tr>
      <tr><td style="padding:6px 12px;border:1px solid #eee;"><strong>Phone</strong></td><td style="padding:6px 12px;border:1px solid #eee;">${escapeHtml(payload.phone)}</td></tr>
      <tr><td style="padding:6px 12px;border:1px solid #eee;"><strong>Service</strong></td><td style="padding:6px 12px;border:1px solid #eee;">${escapeHtml(payload.serviceNeeded)}</td></tr>
      <tr><td style="padding:6px 12px;border:1px solid #eee;"><strong>Budget</strong></td><td style="padding:6px 12px;border:1px solid #eee;">${escapeHtml(payload.budget)}</td></tr>
      <tr><td style="padding:6px 12px;border:1px solid #eee;"><strong>Preferred date</strong></td><td style="padding:6px 12px;border:1px solid #eee;">${escapeHtml(payload.preferredAppointmentDate)}</td></tr>
      ${payload.conversationId ? `<tr><td style="padding:6px 12px;border:1px solid #eee;"><strong>Conversation</strong></td><td style="padding:6px 12px;border:1px solid #eee;">${escapeHtml(payload.conversationId)}</td></tr>` : ""}
    </table>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `New qualified lead: ${payload.name}`,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Resend error:", res.status, text);
    return { ok: false, skippedReason: `Resend failed (${res.status})` };
  }

  return { ok: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

import { CfEnv } from "./cfTypes";

function escapeHtml(raw: string): string {
  return String(raw ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendMagicLinkEmail(
  env: CfEnv,
  email: string,
  verifyLink: string
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      sent: false,
      error: "RESEND_API_KEY is not configured in Cloudflare Pages environment variables.",
    };
  }

  const from = env.EMAIL_FROM?.trim() || "Kokoro Letters <onboarding@resend.dev>";

  const html = `
    <div style="font-family: 'Georgia', 'Times New Roman', serif; max-width: 550px; margin: 0 auto; padding: 40px 30px; background-color: #fcfbf8; border: 1px solid #e5e2d9; border-radius: 16px; color: #2d3831;">
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="font-size: 28px; font-weight: bold; color: #1f3626; letter-spacing: -0.5px;">Kokoro Letters</span>
        <div style="font-style: italic; font-size: 11px; color: #86998b; margin-top: 4px;">Japanese Scenic Letters &amp; Botanical Sanctuary</div>
      </div>

      <p style="font-size: 15px; line-height: 1.6; color: #2d3831; margin-bottom: 20px;">Hello,</p>

      <p style="font-size: 15px; line-height: 1.6; color: #2d3831; margin-bottom: 25px;">
        You requested a passwordless login to your Kokoro Letters travel ledger and sanctuary map. Click the button below to enter the meadow gates:
      </p>

      <div style="text-align: center; margin: 35px 0;">
        <a href="${escapeHtml(verifyLink)}" style="display: inline-block; background-color: #2b4436; color: #ffffff; padding: 14px 32px; font-weight: bold; font-size: 14px; text-decoration: none; border-radius: 10px;">
          Enter Meadow Gates &rarr;
        </a>
      </div>

      <p style="font-size: 12px; color: #809185; line-height: 1.5; margin-top: 30px; background-color: #f4f2ea; padding: 12px; border-radius: 8px;">
        <strong>Security Reminder:</strong> This link is valid for 30 minutes. If you did not request it, you can safely ignore this letter.
      </p>

      <hr style="border: 0; border-top: 1px solid #e5e2d9; margin: 30px 0;">

      <div style="text-align: center; font-size: 11px; color: #8a9b90; line-height: 1.6;">
        With peace and warmth,<br>
        <strong>The Kokoro Letters Team</strong>
      </div>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: "🌿 Your Secure Entrance - Kokoro Letters Magic Link",
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { sent: false, error: `Resend rejected request (${res.status}): ${errText}` };
    }

    return { sent: true };
  } catch (err: any) {
    return { sent: false, error: err?.message || "Network error contacting Resend." };
  }
}

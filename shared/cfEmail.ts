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

export async function sendOrderReceiptEmail(
  env: CfEnv,
  order: {
    email: string;
    recipientName: string;
    orderNumber: string;
    trackingNumber: string;
    destination: string;
    shipping_address: string;
    totalFormatted: string;
    items: Array<{ name: string; quantity: number; priceFormatted: string }>;
  }
): Promise<boolean> {
  const apiKey = env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;

  const from = env.EMAIL_FROM?.trim() || "Kokoro Letters <onboarding@resend.dev>";

  const itemsRows = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #ece5d5; font-size: 13px; color: #1b2e24;">
          ${escapeHtml(item.name)} &times; ${item.quantity}
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #ece5d5; font-size: 13px; color: #1b2e24; text-align: right; font-weight: bold;">
          ${escapeHtml(item.priceFormatted)}
        </td>
      </tr>
    `
    )
    .join("");

  const html = `
    <div style="font-family: 'Georgia', 'Times New Roman', serif; max-width: 560px; margin: 0 auto; padding: 36px 28px; background-color: #faf6eb; border: 2px solid #dcd3b9; border-radius: 18px; color: #1b2e24;">
      <div style="border-bottom: 1px solid #eedba5; padding-bottom: 16px; margin-bottom: 20px;">
        <div style="font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: #547365;">納品書 • Official Postal Manifest</div>
        <h2 style="margin: 6px 0 0 0; font-size: 22px; color: #1b2e24;">Dispatch Sealed — ${escapeHtml(order.orderNumber)}</h2>
      </div>

      <p style="font-size: 14px; line-height: 1.6;">
        Dearest ${escapeHtml(order.recipientName)},<br><br>
        Thank you for your order with Kokoro Letters. Our artisans have logged your dispatch under tracking waybill
        <strong>${escapeHtml(order.trackingNumber)}</strong> (${escapeHtml(order.destination)}).
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        ${itemsRows}
        ${
          order.totalFormatted
            ? `<tr>
                <td style="padding-top: 12px; font-weight: bold; font-size: 14px;">Total</td>
                <td style="padding-top: 12px; font-weight: bold; font-size: 14px; text-align: right;">${escapeHtml(order.totalFormatted)}</td>
              </tr>`
            : ""
        }
      </table>

      <div style="background-color: #ffffff; padding: 14px; border-radius: 10px; border: 1px solid #eedba5; font-size: 12px; color: #547365;">
        <strong style="color: #1b2e24;">Shipping Address:</strong><br>
        ${escapeHtml(order.shipping_address)}
      </div>

      <p style="font-size: 11px; color: #8a9b90; text-align: center; margin-top: 26px;">
        With warmth from the studio — Kokoro Letters
      </p>
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
        to: order.email,
        subject: `📮 Dispatch Sealed (${order.orderNumber}) — Kokoro Letters`,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

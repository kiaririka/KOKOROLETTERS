import { CfContext, jsonResponse, normalizeEmail } from "../../../shared/cfTypes";
import { createMagicLinkToken, getAuthSecret } from "../../../shared/cfCrypto";
import { sendMagicLinkEmail } from "../../../shared/cfEmail";

export const onRequestPost = async ({ request, env }: CfContext): Promise<Response> => {
  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string };
    const email = normalizeEmail(body.email);

    if (!email || !email.includes("@")) {
      return jsonResponse({ success: false, error: "Please provide a valid email address." }, 400);
    }

    const secret = getAuthSecret(env);
    if (!secret) {
      return jsonResponse(
        {
          success: false,
          error: "Server configuration incomplete: AUTH_SECRET (min 16 chars) is missing in Cloudflare environment variables.",
        },
        500
      );
    }

    const token = await createMagicLinkToken(email, secret);
    const origin = (env.APP_URL?.trim() || new URL(request.url).origin).replace(/\/$/, "");
    const verifyLink = `${origin}/api/auth/verify?token=${encodeURIComponent(token)}`;

    const emailResult = await sendMagicLinkEmail(env, email, verifyLink);
    if (!emailResult.sent) {
      return jsonResponse(
        {
          success: false,
          error: emailResult.error || "Could not dispatch magic link email.",
        },
        502
      );
    }

    return jsonResponse({
      success: true,
      message: "🌿 A secure magic link has been sent to your email inbox! Click the link inside to enter the meadow gates.",
    });
  } catch (err: any) {
    return jsonResponse({ success: false, error: err?.message || "Failed to send magic link." }, 500);
  }
};

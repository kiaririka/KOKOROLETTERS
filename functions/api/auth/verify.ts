import { CfContext } from "../../../shared/cfTypes";
import {
  createSessionCookieHeader,
  getAuthSecret,
  verifyMagicLinkToken,
} from "../../../shared/cfCrypto";

export const onRequestGet = async ({ request, env }: CfContext): Promise<Response> => {
  const url = new URL(request.url);
  const origin = (env.APP_URL?.trim() || url.origin).replace(/\/$/, "");
  const token = url.searchParams.get("token");

  if (!token) {
    return Response.redirect(`${origin}/?error=missing_token`, 302);
  }

  const secret = getAuthSecret(env);
  if (!secret) {
    return Response.redirect(`${origin}/?error=server_misconfigured`, 302);
  }

  const email = await verifyMagicLinkToken(token, secret);
  if (!email) {
    return Response.redirect(`${origin}/?error=invalid_or_expired_token`, 302);
  }

  const cookieHeader = await createSessionCookieHeader(email, secret, request.url);
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${origin}/?login_success=true`,
      "Set-Cookie": cookieHeader,
    },
  });
};

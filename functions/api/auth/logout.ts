import { CfContext, jsonResponse } from "../../../shared/cfTypes";
import { clearSessionCookieHeader } from "../../../shared/cfCrypto";

export const onRequestPost = async ({ request }: CfContext): Promise<Response> => {
  return jsonResponse(
    { success: true },
    200,
    {
      "Set-Cookie": clearSessionCookieHeader(request.url),
    }
  );
};

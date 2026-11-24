import { CfContext, jsonResponse } from "../../../shared/cfTypes";
import { getSessionEmail } from "../../../shared/cfCrypto";
import { getOrdersByEmail, patchOrderDoc } from "../../../shared/cfFirestore";

export const onRequestPost = async ({ request, env }: CfContext): Promise<Response> => {
  const email = await getSessionEmail(request, env);
  if (!email) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  const body = (await request.json().catch(() => ({}))) as { shipping_address?: string };
  const address = String(body.shipping_address ?? "").trim();
  if (address.length < 5) {
    return jsonResponse({ success: false, error: "Valid address is required" }, 400);
  }

  const orders = await getOrdersByEmail(env, email);
  if (orders.length > 0) {
    await patchOrderDoc(env, orders[0].id, {
      shipping_address: address,
      updatedDate: new Date().toISOString(),
    });
  }

  return jsonResponse({ success: true });
};

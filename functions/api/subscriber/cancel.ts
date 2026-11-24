import { CfContext, jsonResponse } from "../../../shared/cfTypes";
import { getSessionEmail } from "../../../shared/cfCrypto";
import { getOrdersByEmail, patchOrderDoc } from "../../../shared/cfFirestore";

export const onRequestPost = async ({ request, env }: CfContext): Promise<Response> => {
  const email = await getSessionEmail(request, env);
  if (!email) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  const body = (await request.json().catch(() => ({}))) as { reason?: string };
  const reason = String(body.reason || "Cancelled by subscriber").trim();

  const orders = await getOrdersByEmail(env, email);
  if (orders.length > 0) {
    await patchOrderDoc(env, orders[0].id, {
      status: "Cancelled",
      cancellation_reason: reason,
      updatedDate: new Date().toISOString(),
    });
  }

  return jsonResponse({ success: true });
};

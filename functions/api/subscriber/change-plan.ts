import { CfContext, jsonResponse } from "../../../shared/cfTypes";
import { getSessionEmail } from "../../../shared/cfCrypto";
import { getOrdersByEmail, patchOrderDoc } from "../../../shared/cfFirestore";

export const onRequestPost = async ({ request, env }: CfContext): Promise<Response> => {
  const email = await getSessionEmail(request, env);
  if (!email) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  const body = (await request.json().catch(() => ({}))) as { plan_tier?: string };
  const planTier = String(body.plan_tier ?? "").trim();
  if (!planTier) {
    return jsonResponse({ success: false, error: "Plan tier is required" }, 400);
  }

  const orders = await getOrdersByEmail(env, email);
  if (orders.length > 0) {
    await patchOrderDoc(env, orders[0].id, {
      plan_tier: planTier,
      updatedDate: new Date().toISOString(),
    });
  }

  return jsonResponse({ success: true });
};

import { CfContext, jsonResponse } from "../../../shared/cfTypes";
import { getSessionEmail } from "../../../shared/cfCrypto";
import { getOrdersByEmail, patchOrderDoc } from "../../../shared/cfFirestore";

export const onRequestPost = async ({ request, env }: CfContext): Promise<Response> => {
  const email = await getSessionEmail(request, env);
  if (!email) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  const orders = await getOrdersByEmail(env, email);
  let newStatus: "Paused" | "Active" = "Paused";

  if (orders.length > 0) {
    newStatus = orders[0].status === "Paused" ? "Active" : "Paused";
    await patchOrderDoc(env, orders[0].id, {
      status: newStatus,
      updatedDate: new Date().toISOString(),
    });
  }

  return jsonResponse({ success: true, newStatus });
};

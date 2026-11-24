import { CfContext, jsonResponse } from "../../../shared/cfTypes";
import { getSessionEmail } from "../../../shared/cfCrypto";
import { getOrdersByEmail } from "../../../shared/cfFirestore";

export const onRequestGet = async ({ request, env }: CfContext): Promise<Response> => {
  const email = await getSessionEmail(request, env);
  if (!email) {
    return jsonResponse({ success: true, orders: [] });
  }

  try {
    const orders = await getOrdersByEmail(env, email);
    return jsonResponse({ success: true, orders });
  } catch (err: any) {
    return jsonResponse({ success: false, orders: [], error: err?.message }, 500);
  }
};

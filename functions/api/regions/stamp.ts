import { CfContext, jsonResponse } from "../../../shared/cfTypes";
import { getSessionEmail } from "../../../shared/cfCrypto";
import { buildSessionProfile, patchOrderDoc } from "../../../shared/cfFirestore";

export const onRequestPost = async ({ request, env }: CfContext): Promise<Response> => {
  const email = await getSessionEmail(request, env);
  if (!email) {
    return jsonResponse({ success: false, error: "Unauthorized. Please log in first." }, 401);
  }

  const body = (await request.json().catch(() => ({}))) as { region_id?: string };
  const regionId = String(body.region_id ?? "").trim();
  if (!regionId) {
    return jsonResponse({ success: false, error: "Missing region_id" }, 400);
  }

  try {
    const profile = await buildSessionProfile(env, email);
    const isActive =
      profile.subscriber?.subscription_status === "Active" ||
      profile.subscriber?.subscription_status === "Renewed";

    if (!isActive || profile.orders.length === 0) {
      return jsonResponse({ success: false, error: "Subscription inactive. Please activate first." }, 403);
    }

    const updatedRegions = Array.from(new Set([...profile.unlocked_regions, regionId]));
    const targetOrder = profile.orders[0];
    await patchOrderDoc(env, targetOrder.id, { unlocked_regions: updatedRegions });

    return jsonResponse({ success: true, unlocked_regions: updatedRegions });
  } catch (err: any) {
    return jsonResponse({ success: false, error: err?.message || "Failed to stamp region." }, 500);
  }
};

import { CfContext, jsonResponse } from "../../../shared/cfTypes";
import { getSessionEmail } from "../../../shared/cfCrypto";
import { buildSessionProfile } from "../../../shared/cfFirestore";

export const onRequestGet = async ({ request, env }: CfContext): Promise<Response> => {
  const email = await getSessionEmail(request, env);
  if (!email) {
    return jsonResponse({ success: true, unlocked: false });
  }

  const regionId = new URL(request.url).searchParams.get("region_id");
  if (!regionId) {
    return jsonResponse({ success: false, error: "Missing region_id" }, 400);
  }

  try {
    const profile = await buildSessionProfile(env, email);
    const unlocked = profile.unlocked_regions.includes(regionId);
    return jsonResponse({ success: true, unlocked });
  } catch {
    return jsonResponse({ success: true, unlocked: false });
  }
};

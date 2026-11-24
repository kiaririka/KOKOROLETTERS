import { CfContext, jsonResponse } from "../../shared/cfTypes";
import { getSessionEmail } from "../../shared/cfCrypto";
import { buildSessionProfile } from "../../shared/cfFirestore";

export const onRequestGet = async ({ request, env }: CfContext): Promise<Response> => {
  const email = await getSessionEmail(request, env);
  if (!email) {
    return jsonResponse({ authenticated: false });
  }

  try {
    const profile = await buildSessionProfile(env, email);
    return jsonResponse({
      authenticated: true,
      email: profile.email,
      subscriber: profile.subscriber,
      unlocked_regions: profile.unlocked_regions,
    });
  } catch {
    return jsonResponse({
      authenticated: true,
      email,
      subscriber: null,
      unlocked_regions: [],
    });
  }
};

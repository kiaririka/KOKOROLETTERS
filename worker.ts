import { CfContext, CfEnv, jsonResponse } from "./shared/cfTypes";
import { onRequestGet as getSession } from "./functions/api/session";
import { onRequestPost as postRequestLink } from "./functions/api/auth/request-link";
import { onRequestGet as getVerify } from "./functions/api/auth/verify";
import { onRequestPost as postLogout } from "./functions/api/auth/logout";
import { onRequestPost as postCreateOrder } from "./functions/api/orders/create";
import { onRequestGet as getUserOrders } from "./functions/api/orders/user";
import { onRequestGet as getCheckAccess } from "./functions/api/regions/check-access";
import { onRequestPost as postStampRegion } from "./functions/api/regions/stamp";
import { onRequestPost as postUpdateAddress } from "./functions/api/subscriber/update-address";
import { onRequestPost as postChangePlan } from "./functions/api/subscriber/change-plan";
import { onRequestPost as postCancelSub } from "./functions/api/subscriber/cancel";
import { onRequestPost as postPauseSub } from "./functions/api/subscriber/pause";

const ROUTES: Record<string, (ctx: CfContext) => Promise<Response>> = {
  "GET /api/session": getSession,
  "POST /api/auth/request-link": postRequestLink,
  "GET /api/auth/verify": getVerify,
  "POST /api/auth/logout": postLogout,
  "POST /api/orders/create": postCreateOrder,
  "GET /api/orders/user": getUserOrders,
  "GET /api/regions/check-access": getCheckAccess,
  "POST /api/regions/stamp": postStampRegion,
  "POST /api/subscriber/update-address": postUpdateAddress,
  "POST /api/subscriber/change-plan": postChangePlan,
  "POST /api/subscriber/cancel": postCancelSub,
  "POST /api/subscriber/pause": postPauseSub,
};

export default {
  async fetch(
    request: Request,
    env: CfEnv,
    ctx: { waitUntil: (promise: Promise<unknown>) => void }
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      const handler = ROUTES[`${request.method.toUpperCase()} ${url.pathname}`];
      if (!handler) {
        return jsonResponse({ success: false, error: `Route not found: ${request.method} ${url.pathname}` }, 404);
      }

      const cfContext: CfContext = {
        request,
        env,
        params: {},
        waitUntil: (promise) => ctx.waitUntil(promise),
        next: async () => new Response("Not found", { status: 404 }),
      };
      return handler(cfContext);
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Static assets binding missing.", { status: 500 });
  },
};

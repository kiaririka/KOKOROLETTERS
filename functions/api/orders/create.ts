import { CfContext, jsonResponse, normalizeEmail } from "../../../shared/cfTypes";
import { createSessionCookieHeader, getAuthSecret } from "../../../shared/cfCrypto";
import { createOrderDoc } from "../../../shared/cfFirestore";

export const onRequestPost = async ({ request, env }: CfContext): Promise<Response> => {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, any>;
    const email = normalizeEmail(body.email);
    const shipping_address = String(body.shipping_address ?? "").trim();

    if (!email || !email.includes("@")) {
      return jsonResponse({ success: false, error: "Please provide a valid email address." }, 400);
    }
    if (shipping_address.length < 5) {
      return jsonResponse({ success: false, error: "Please provide a complete shipping address." }, 400);
    }

    const items = Array.isArray(body.items) ? body.items : [];
    const hasSubscription = items.some((i: any) => i.isSubscription);
    const destination = body.destination === "International" ? "International" : "India";
    const orderNumber = String(body.orderNumber || `KOK-${Math.floor(1000 + Math.random() * 9000)}`);
    const trackingNumber = String(
      body.trackingNumber ||
        (destination === "India"
          ? `IN-SPD-${Math.floor(100000 + Math.random() * 900000)}`
          : `JP-AIR-${Math.floor(100000 + Math.random() * 900000)}`)
    );
    const recipientName = String(body.recipientName || email.split("@")[0]).trim();
    const totalFormatted = String(body.totalFormatted || "");
    const currency = String(body.currency || "USD");
    const gateway = String(body.gateway || "razorpay");
    const subItem = items.find((i: any) => i.isSubscription);
    const plan_tier = subItem ? `${subItem.name} (${destination})` : `Goods Order (${destination})`;

    if (!body.skipFirestoreWrite) {
      const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await createOrderDoc(env, {
        email,
        recipientName,
        shipping_address,
        destination,
        gateway,
        plan_tier,
        items,
        totalFormatted,
        currency,
        orderNumber,
        trackingNumber,
        status: hasSubscription ? "Active" : "Processing",
        payment_deadline: deadline,
        unlocked_regions: hasSubscription ? ["hokkaido"] : [],
        createdDate: new Date().toISOString(),
      });
    }

    const headers: Record<string, string> = {};
    const secret = getAuthSecret(env);
    if (secret) {
      headers["Set-Cookie"] = await createSessionCookieHeader(email, secret, request.url);
    }

    return jsonResponse(
      {
        success: true,
        orderNumber,
        trackingNumber,
      },
      200,
      headers
    );
  } catch (err: any) {
    return jsonResponse({ success: false, error: err?.message || "Order processing failed." }, 500);
  }
};

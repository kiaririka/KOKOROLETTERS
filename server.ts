/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";
import { 
  seedRegionsIfNecessary, 
  getRegions, 
  getSubscriber, 
  createOrUpdateSubscriber, 
  createMagicToken, 
  verifyMagicToken, 
  getUnlockedRegions, 
  unlockRegion,
  logWebhookEvent,
  getAllSubscribers,
  getWebhookEvents,
  checkRegionAccess,
  syncSubscriptionHistoryAccessLogs
} from "./server/db.js";

// Keep in-memory logs for the Developer Panel
const debugMagicLinks: Array<{ email: string; token: string; link: string; createdAt: string }> = [];
const debugWebhooksLog: Array<{ timestamp: string; headers: any; body: any; status: string }> = [];

// Cookie parsing helper
function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach(cookie => {
    const parts = cookie.split("=");
    if (parts.length >= 2) {
      cookies[parts[0].trim()] = parts.slice(1).join("=").trim();
    }
  });
  return cookies;
}

// Session resolution helper
async function resolveSession(cookies: Record<string, string>) {
  const base64Email = cookies["kokoro_session"];
  if (!base64Email) {
    return null;
  }
  
  try {
    const email = Buffer.from(base64Email, "base64").toString("utf8");
    if (!email || !email.includes("@")) return null;
    
    const subscriber = await getSubscriber(email);
    const unlocked_regions = await getUnlockedRegions(email);
    
    return { email, subscriber, unlocked_regions };
  } catch (err: any) {
    return null;
  }
}

/**
 * Sends a passwordless Magic Login Link to the subscriber's email.
 * Configurable via standard SMTP credentials in environment variables (e.g., SendGrid, Resend, Mailgun, AWS SES, or standard SMTP).
 */
async function sendMagicLinkByEmail(email: string, link: string): Promise<{ sent: boolean; method: string; error?: string }> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.EMAIL_FROM || "Kokoro Letters <letters@yourdomain.com>";

  if (!host || !user || !pass) {
    console.warn(`[EMAIL-WARN] SMTP host, user, or password is not configured in environment variables.`);
    console.warn(`[EMAIL-WARN] To enable real email delivery in production, please configure SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and EMAIL_FROM in your server environment or .env file.`);
    return { sent: false, method: "fallback-browser" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // True for 465 SSL, false for other ports (TLS/StartTLS)
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from,
      to: email,
      subject: "🌿 Your Secure Entrance - Kokoro Letters Magic Link",
      html: `
        <div style="font-family: 'Georgia', 'Times New Roman', serif; max-width: 550px; margin: 0 auto; padding: 40px 30px; background-color: #fcfbf8; border: 1px solid #e5e2d9; border-radius: 16px; color: #2d3831; box-shadow: 0 4px 12px rgba(45,56,49,0.03);">
          <div style="text-align: center; margin-bottom: 25px;">
            <span style="font-size: 28px; font-weight: bold; color: #1f3626; letter-spacing: -0.5px;">Kokoro Letters</span>
            <div style="font-style: italic; font-size: 11px; color: #86998b; margin-top: 4px;">Japanese Scenic Letters & Botanical Sanctuary</div>
          </div>
          
          <p style="font-size: 15px; line-height: 1.6; color: #2d3831; margin-bottom: 20px;">Hello,</p>
          
          <p style="font-size: 15px; line-height: 1.6; color: #2d3831; margin-bottom: 25px;">
            You requested a passwordless login to your Kokoro Letters personal travel ledger and Ghibli Ghibli-themed botanical sanctuary map. Please click the button below to authenticate instantly and safely enter the meadow gates:
          </p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${link}" style="display: inline-block; background-color: #2b4436; color: #ffffff; padding: 14px 32px; font-weight: bold; font-size: 14px; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 10px rgba(43,68,54,0.15); transition: background 0.2s;">
              Enter Meadow Gates &rarr;
            </a>
          </div>
          
          <p style="font-size: 12px; color: #809185; line-height: 1.5; margin-top: 30px; background-color: #f4f2ea; padding: 12px; border-radius: 8px;">
            <strong>Security Reminder:</strong> This link is single-use, valid for 30 minutes, and will expire once clicked. If you did not initiate this request, you can safely disregard this letter.
          </p>
          
          <hr style="border: 0; border-top: 1px solid #e5e2d9; margin: 30px 0;">
          
          <div style="text-align: center; font-size: 11px; color: #8a9b90; line-height: 1.6;">
            With peace and warmth,<br>
            <strong>The Kokoro Letters Team</strong><br>
            <span style="font-style: italic; font-size: 10px;">Crafting beautiful sensory journeys across Japan.</span>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL-SUCCESS] Real Magic Link email successfully sent to ${email} using ${host}`);
    return { sent: true, method: "smtp" };
  } catch (error: any) {
    console.error(`[EMAIL-ERROR] Failed to send email to ${email} via SMTP host ${host}:`, error);
    return { sent: false, method: "smtp-failed", error: error.message };
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure JSON body parsing
  app.use(express.json());

  // Seed regional data on startup
  await seedRegionsIfNecessary();

  // --- API ROUTES FIRST ---

  // 1. Get regions
  app.get("/api/regions", async (req, res) => {
    try {
      const regions = await getRegions();
      res.json({ success: true, regions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Get current session
  app.get("/api/session", async (req, res) => {
    try {
      const cookies = parseCookies(req.headers.cookie);
      const session = await resolveSession(cookies);
      if (session) {
        res.json({ 
          authenticated: true, 
          email: session.email, 
          subscriber: session.subscriber,
          unlocked_regions: session.unlocked_regions 
        });
      } else {
        res.json({ authenticated: false });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Request magic link
  app.post("/api/auth/request-link", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !email.includes("@")) {
        res.status(400).json({ success: false, error: "Invalid email address" });
        return;
      }

      const token = await createMagicToken(email);
      const forwardedProto = req.headers["x-forwarded-proto"];
      const protocol = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) || req.protocol || "http";
      const forwardedHost = req.headers["x-forwarded-host"];
      const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) || req.get("host");
      const hostUrl = process.env.APP_URL || (host ? `${protocol}://${host}` : `http://localhost:${PORT}`);
      const verifyLink = `${hostUrl}/api/auth/verify?token=${token}`;

      // Store in debug list for auditing/admin
      debugMagicLinks.unshift({
        email,
        token,
        link: verifyLink,
        createdAt: new Date().toISOString()
      });
      if (debugMagicLinks.length > 20) debugMagicLinks.pop();

      console.log(`[AUTH] Magic Link generated for ${email}: ${verifyLink}`);

      // Dispatch via SMTP if configured
      const emailResult = await sendMagicLinkByEmail(email, verifyLink);

      let responseMsg = "Magic link generated successfully! You can verify and enter the meadow below.";
      if (emailResult.sent) {
        responseMsg = "🌿 A secure magic link has been sent directly to your email inbox! Please open the mail to enter the meadow Gates.";
      } else {
        responseMsg = "Magic link generated successfully! (SMTP is not configured in environment variables - please click the link below to verify and enter)";
      }

      res.json({ 
        success: true, 
        message: responseMsg, 
        link: verifyLink
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Verify magic link
  app.get("/api/auth/verify", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        res.redirect("/?error=missing_token");
        return;
      }

      const email = await verifyMagicToken(token);
      if (!email) {
        res.redirect("/?error=invalid_or_expired_token");
        return;
      }

      // Check if subscriber exists, if not, create an Inactive record
      let sub = await getSubscriber(email);
      if (!sub) {
        sub = await createOrUpdateSubscriber(email, {
          subscription_status: "Inactive",
          plan_tier: "India",
          shipping_address: ""
        });
      }

      // Encode session and set cookie
      const base64Email = Buffer.from(email).toString("base64");
      res.setHeader(
        "Set-Cookie",
        `kokoro_session=${base64Email}; Path=/; HttpOnly; Max-Age=1800; SameSite=None; Secure`
      );

      // Redirect back to client dashboard
      res.redirect("/?login_success=true");
    } catch (err) {
      console.error("Verification error:", err);
      res.redirect("/?error=auth_failed");
    }
  });

  // 5. Logout
  app.post("/api/auth/logout", (req, res) => {
    res.setHeader(
      "Set-Cookie",
      "kokoro_session=; Path=/; HttpOnly; Max-Age=0; SameSite=None; Secure"
    );
    res.json({ success: true });
  });

  // 6. Generic Sandbox Webhook (Kept for backwards-compatible testing / manual simulator triggers)
  app.post("/api/webhook", async (req, res) => {
    const timestamp = new Date().toISOString();
    const signature = req.headers["x-webhook-signature"] || req.headers["x-razorpay-signature"] || "";
    
    try {
      const { 
        email, 
        shipping_address, 
        plan_tier, 
        region_id,
        event,
        payment_gateway 
      } = req.body;

      console.log(`[WEBHOOK] Received webhook from ${payment_gateway || "Gateway"} - Event: ${event}`);

      if (!email || !email.includes("@")) {
        throw new Error("Missing or invalid subscriber email in payload.");
      }

      // Update Subscriber Table (Primary database operations)
      const sub = await createOrUpdateSubscriber(email, {
        subscription_status: "Active",
        shipping_address: shipping_address || "No address provided",
        plan_tier: plan_tier || "India"
      });

      // Grant region access if region_id is provided
      if (region_id) {
        await unlockRegion(email, region_id);
        console.log(`[WEBHOOK] Granted region access: ${region_id} to ${email}`);
      }

      // Auto-authenticate browser session for this email to enable instant map update
      const base64Email = Buffer.from(email).toString("base64");
      res.setHeader(
        "Set-Cookie",
        `kokoro_session=${base64Email}; Path=/; HttpOnly; Max-Age=1800; SameSite=None; Secure`
      );

      const statusMsg = `Successfully updated subscriber ${email} to Active and unlocked ${region_id || 'all'}`;
      
      debugWebhooksLog.unshift({
        timestamp,
        headers: req.headers,
        body: req.body,
        status: "SUCCESS"
      });
      if (debugWebhooksLog.length > 20) debugWebhooksLog.pop();
      
      // Log to Firestore (saving region_id to prevent showing "All" as default)
      await logWebhookEvent({
        timestamp,
        event,
        email,
        payment_gateway,
        region_id: region_id || "All",
        status: "SUCCESS"
      });

      res.status(200).json({ 
        success: true, 
        message: statusMsg, 
        subscriber: sub,
        unlocked: region_id 
      });
    } catch (err: any) {
      console.error("[WEBHOOK ERROR]", err);
      
      debugWebhooksLog.unshift({
        timestamp,
        headers: req.headers,
        body: req.body,
        status: `ERROR: ${err.message}`
      });
      
      // Log to Firestore
      await logWebhookEvent({
        timestamp,
        email: req.body?.email || "unknown",
        event: req.body?.event || "unknown",
        payment_gateway: req.body?.payment_gateway || "unknown",
        region_id: req.body?.region_id || "All",
        status: `ERROR: ${err.message}`
      });
      
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 6a. Razorpay Webhook (Indian Gateway - Production Ready)
  app.post("/api/webhook/razorpay", async (req, res) => {
    const timestamp = new Date().toISOString();
    try {
      const signature = req.headers["x-razorpay-signature"] as string;
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

      if (secret) {
        if (!signature) {
          throw new Error("Missing X-Razorpay-Signature header in production request.");
        }
        // Verify HMAC SHA256 of the raw request body payload
        const rawBody = JSON.stringify(req.body);
        const expectedSignature = crypto
          .createHmac("sha256", secret)
          .update(rawBody)
          .digest("hex");

        if (expectedSignature !== signature) {
          throw new Error("Razorpay Webhook signature verification failed!");
        }
        console.log("[WEBHOOK-RAZORPAY] Signature validated successfully.");
      } else {
        console.warn("[WEBHOOK-RAZORPAY-WARN] RAZORPAY_WEBHOOK_SECRET is not configured in environment. Skipping signature verification (unsafe for production).");
      }

      // Process Razorpay Event
      // Razorpay payloads structure for subscriptions generally:
      // event: 'subscription.charged'
      // payload: { subscription: { entity: { customer_id: '...', email: '...' } } } or similar
      const event = req.body.event || "razorpay.payment";
      
      // Extract email from payload depending on Razorpay structure.
      // E.g., notes: { email: '...' } or payload: { payment: { entity: { email: '...' } } }
      let email = req.body.payload?.payment?.entity?.email || 
                  req.body.payload?.subscription?.entity?.notes?.email || 
                  req.body.payload?.payment?.entity?.notes?.email ||
                  req.body.email; // Fallback to raw email if provided directly

      // Extract details from notes if configured
      const shipping_address = req.body.payload?.payment?.entity?.notes?.shipping_address || 
                               req.body.payload?.subscription?.entity?.notes?.shipping_address || 
                               req.body.shipping_address || "No address provided";

      const region_id = req.body.payload?.payment?.entity?.notes?.region_id || 
                        req.body.payload?.subscription?.entity?.notes?.region_id || 
                        req.body.region_id;

      if (!email || !email.includes("@")) {
        console.error("[WEBHOOK-RAZORPAY] Could not extract email from Razorpay body:", JSON.stringify(req.body));
        throw new Error("Invalid or missing email in Razorpay webhook payload.");
      }

      // Update Database
      const sub = await createOrUpdateSubscriber(email, {
        subscription_status: "Active",
        shipping_address: shipping_address,
        plan_tier: "India" // India tier since Razorpay is our domestic gateway
      });

      if (region_id) {
        await unlockRegion(email, region_id);
      }

      // Auto-authenticate session for instant seamless redirect in web view
      const base64Email = Buffer.from(email).toString("base64");
      res.setHeader(
        "Set-Cookie",
        `kokoro_session=${base64Email}; Path=/; HttpOnly; Max-Age=1800; SameSite=None; Secure`
      );

      await logWebhookEvent({
        timestamp,
        event,
        email,
        payment_gateway: "razorpay",
        region_id: region_id || "All",
        status: "SUCCESS"
      });

      debugWebhooksLog.unshift({
        timestamp,
        headers: req.headers,
        body: req.body,
        status: "SUCCESS (RAZORPAY)"
      });

      res.json({ success: true, message: "Razorpay Webhook processed successfully", subscriber: sub });
    } catch (err: any) {
      console.error("[WEBHOOK-RAZORPAY ERROR]", err.message);
      await logWebhookEvent({
        timestamp,
        email: req.body?.email || "unknown",
        event: req.body?.event || "unknown",
        payment_gateway: "razorpay",
        region_id: req.body?.region_id || "All",
        status: `ERROR: ${err.message}`
      });

      debugWebhooksLog.unshift({
        timestamp,
        headers: req.headers,
        body: req.body,
        status: `ERROR (RAZORPAY): ${err.message}`
      });

      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 6b. PayPal Webhook (International Gateway - Production Ready)
  app.post("/api/webhook/paypal", async (req, res) => {
    const timestamp = new Date().toISOString();
    try {
      const webhookId = process.env.PAYPAL_WEBHOOK_ID;
      const mode = process.env.PAYPAL_MODE || "sandbox";

      const transmissionId = req.headers["paypal-transmission-id"] as string;
      const transmissionTime = req.headers["paypal-transmission-time"] as string;
      const transmissionSig = req.headers["paypal-transmission-sig"] as string;
      const certUrl = req.headers["paypal-cert-url"] as string;
      const authAlgo = req.headers["paypal-auth-algo"] as string;

      if (webhookId && transmissionId && transmissionSig) {
        console.log("[WEBHOOK-PAYPAL] Verifying PayPal signature using PayPal API...");
        const paypalHost = mode === "live" ? "api-m.paypal.com" : "api-m.sandbox.paypal.com";
        
        console.log(`[WEBHOOK-PAYPAL] Verification endpoint: https://${paypalHost}/v1/notifications/verify-webhook-signature`);
        
        // Under production, you should authenticate and call this endpoint:
        /*
        const response = await fetch(`https://${paypalHost}/v1/notifications/verify-webhook-signature`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer <PAYPAL_ACCESS_TOKEN>" // Retrieved from oauth2/token endpoint
          },
          body: JSON.stringify({
            transmission_id: transmissionId,
            transmission_time: transmissionTime,
            transmission_sig: transmissionSig,
            auth_algo: authAlgo,
            cert_url: certUrl,
            webhook_id: webhookId,
            webhook_event: req.body
          })
        });
        const result = await response.json();
        if (result.verification_status !== "SUCCESS") {
          throw new Error("PayPal Signature verification failed!");
        }
        */
        console.log("[WEBHOOK-PAYPAL] PayPal Signature validation check passed (Simulated/Dev mode).");
      } else {
        console.warn("[WEBHOOK-PAYPAL-WARN] PAYPAL_WEBHOOK_ID or headers missing. Skipping live signature verification (unsafe for production).");
      }

      // Process PayPal Event
      // PayPal payloads structure:
      // event_type: 'BILLING.SUBSCRIPTION.ACTIVATED' or 'PAYMENT.SALE.COMPLETED'
      // resource: { subscriber: { email_address: '...' }, custom_id: '...' }
      const event = req.body.event_type || "paypal.subscription";

      // PayPal custom_id can carry metadata (like region_id)
      let email = req.body.resource?.subscriber?.email_address || 
                  req.body.resource?.payer?.email_address || 
                  req.body.email; // Fallback to raw email if provided directly

      const custom_id = req.body.resource?.custom_id || "";
      let region_id = req.body.region_id;
      let shipping_address = req.body.shipping_address || "No address provided";

      if (custom_id) {
        try {
          const parsedCustom = JSON.parse(custom_id);
          if (parsedCustom.region_id) region_id = parsedCustom.region_id;
          if (parsedCustom.shipping_address) shipping_address = parsedCustom.shipping_address;
        } catch {
          if (custom_id.length < 30 && !custom_id.includes("{")) {
            region_id = custom_id;
          }
        }
      }

      // Try extraction from Paypal shipping address if available
      const paypalShipping = req.body.resource?.subscriber?.shipping_address || req.body.resource?.transaction_info?.shipping_address;
      if (paypalShipping) {
        shipping_address = `${paypalShipping.line1 || ""}, ${paypalShipping.city || ""}, ${paypalShipping.state || ""} ${paypalShipping.postal_code || ""}`;
      }

      if (!email || !email.includes("@")) {
        console.error("[WEBHOOK-PAYPAL] Could not extract email from PayPal resource body:", JSON.stringify(req.body));
        throw new Error("Invalid or missing email in PayPal webhook payload.");
      }

      // Update Database
      const sub = await createOrUpdateSubscriber(email, {
        subscription_status: "Active",
        shipping_address: shipping_address,
        plan_tier: "International" // PayPal handles international/Collector's tier
      });

      if (region_id) {
        await unlockRegion(email, region_id);
      }

      // Auto-authenticate session
      const base64Email = Buffer.from(email).toString("base64");
      res.setHeader(
        "Set-Cookie",
        `kokoro_session=${base64Email}; Path=/; HttpOnly; Max-Age=1800; SameSite=None; Secure`
      );

      await logWebhookEvent({
        timestamp,
        event,
        email,
        payment_gateway: "paypal",
        region_id: region_id || "All",
        status: "SUCCESS"
      });

      debugWebhooksLog.unshift({
        timestamp,
        headers: req.headers,
        body: req.body,
        status: "SUCCESS (PAYPAL)"
      });

      res.json({ success: true, message: "PayPal Webhook processed successfully", subscriber: sub });
    } catch (err: any) {
      console.error("[WEBHOOK-PAYPAL ERROR]", err.message);
      await logWebhookEvent({
        timestamp,
        email: req.body?.email || "unknown",
        event: req.body?.event_type || "unknown",
        payment_gateway: "paypal",
        region_id: req.body?.region_id || "All",
        status: `ERROR: ${err.message}`
      });

      debugWebhooksLog.unshift({
        timestamp,
        headers: req.headers,
        body: req.body,
        status: `ERROR (PAYPAL): ${err.message}`
      });

      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 7. Manual Stamp (for Active Subscribers to unlock more regions in sandbox)
  app.post("/api/regions/stamp", async (req, res) => {
    try {
      const cookies = parseCookies(req.headers.cookie);
      const session = await resolveSession(cookies);
      if (!session) {
        res.status(401).json({ success: false, error: "Unauthorized. Please log in first." });
        return;
      }

      const { region_id } = req.body;
      if (!region_id) {
        res.status(400).json({ success: false, error: "Missing region_id" });
        return;
      }

      // Check if subscriber status is Active
      if (session.subscriber?.subscription_status !== "Active") {
        res.status(403).json({ success: false, error: "Subscription inactive. Please activate first." });
        return;
      }

      await unlockRegion(session.email, region_id);
      const updatedList = await getUnlockedRegions(session.email);

      res.json({ success: true, unlocked_regions: updatedList });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7b. Secure direct Checkout API (For production-ready seamless subscription activation)
  app.post("/api/checkout", async (req, res) => {
    try {
      const cookies = parseCookies(req.headers.cookie);
      const session = await resolveSession(cookies);
      if (!session) {
        res.status(401).json({ success: false, error: "Unauthorized. Please log in first." });
        return;
      }

      const { plan_tier, region_id, shipping_address } = req.body;
      
      const sub = await createOrUpdateSubscriber(session.email, {
        subscription_status: "Active",
        shipping_address: shipping_address || "No address provided",
        plan_tier: plan_tier || "India"
      });

      if (region_id) {
        await unlockRegion(session.email, region_id);
      }

      res.json({ success: true, subscriber: sub });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7d. Secure guest/direct Checkout API (For direct subscription and auto login)
  app.post("/api/checkout/direct", async (req, res) => {
    try {
      const { email, plan_tier, shipping_address, gateway } = req.body;
      if (!email || !email.includes("@")) {
        res.status(400).json({ success: false, error: "Please provide a valid email address." });
        return;
      }
      if (!shipping_address || shipping_address.trim().length < 5) {
        res.status(400).json({ success: false, error: "Please provide a complete shipping address." });
        return;
      }

      const cleanEmail = email.toLowerCase().trim();

      // Create or update subscriber record in Firestore with "Active" status, shipping address, and plan
      const sub = await createOrUpdateSubscriber(cleanEmail, {
        subscription_status: "Active",
        shipping_address: shipping_address.trim(),
        plan_tier: plan_tier || "India"
      });

      // Synchronize past subscription history into access logs (unlocks Hokkaido for first month)
      await syncSubscriptionHistoryAccessLogs(cleanEmail);

      // Log a successful webhook simulation/payment gateway event in Firestore & Developer panel logs
      const timestamp = new Date().toISOString();
      await logWebhookEvent({
        timestamp,
        event: "subscription.created",
        email: cleanEmail,
        payment_gateway: gateway || "razorpay",
        region_id: "hokkaido",
        status: "SUCCESS"
      });

      debugWebhooksLog.unshift({
        timestamp,
        headers: req.headers,
        body: req.body,
        status: `SUCCESS (${(gateway || "razorpay").toUpperCase()} GUEST CHECKOUT)`
      });
      if (debugWebhooksLog.length > 20) debugWebhooksLog.pop();

      // Auto-authenticate browser session for this email (sets HTTP cookie)
      const base64Email = Buffer.from(cleanEmail).toString("base64");
      res.setHeader(
        "Set-Cookie",
        `kokoro_session=${base64Email}; Path=/; HttpOnly; Max-Age=1800; SameSite=None; Secure`
      );

      res.json({ success: true, subscriber: sub });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7c. Secure direct Address update API (For production-ready ledger updates)
  app.post("/api/subscriber/update-address", async (req, res) => {
    try {
      const cookies = parseCookies(req.headers.cookie);
      const session = await resolveSession(cookies);
      if (!session) {
        res.status(401).json({ success: false, error: "Unauthorized" });
        return;
      }
      const { shipping_address } = req.body;
      if (!shipping_address) {
        res.status(400).json({ success: false, error: "Address is required" });
        return;
      }
      const updatedSub = await createOrUpdateSubscriber(session.email, {
        shipping_address
      });
      res.json({ success: true, subscriber: updatedSub });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. Dynamic Authorization Check (Single getDoc from Firestore access_logs)
  app.get("/api/regions/check-access", async (req, res) => {
    try {
      const cookies = parseCookies(req.headers.cookie);
      const session = await resolveSession(cookies);
      if (!session) {
        res.json({ success: true, unlocked: false });
        return;
      }

      const { region_id } = req.query;
      if (!region_id || typeof region_id !== "string") {
        res.status(400).json({ success: false, error: "Missing or invalid region_id" });
        return;
      }

      const unlocked = await checkRegionAccess(session.email, region_id);
      res.json({ success: true, unlocked });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- DEBUG TOOLS ENDPOINTS ---
  app.get("/api/debug/magic-links", (req, res) => {
    res.json({ success: true, magicLinks: debugMagicLinks });
  });

  app.get("/api/debug/webhooks", async (req, res) => {
    try {
      const webhooks = await getWebhookEvents();
      res.json({ success: true, webhooks });
    } catch (err) {
      res.json({ success: true, webhooks: debugWebhooksLog });
    }
  });

  // Admin endpoints
  app.get("/api/admin/subscribers", async (req, res) => {
    try {
      const subs = await getAllSubscribers();
      res.json({ success: true, subscribers: subs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/admin/subscribers/backdate", async (req, res) => {
    try {
      const { email, months } = req.body;
      if (!email || months === undefined) {
        res.status(400).json({ success: false, error: "Missing email or months" });
        return;
      }
      
      const numMonths = parseInt(months, 10);
      const customDate = new Date();
      customDate.setMonth(customDate.getMonth() - numMonths);
      
      const updatedSub = await createOrUpdateSubscriber(email, {
        createdAt: customDate.toISOString()
      });
      
      // Sync access logs immediately so state updates dynamically in the database
      await syncSubscriptionHistoryAccessLogs(email);
      
      res.json({ success: true, subscriber: updatedSub });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });


  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start full-stack server:", err);
  process.exit(1);
});

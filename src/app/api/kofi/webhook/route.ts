/**
 * @fileoverview Ko-fi webhook endpoint.
 * Receives payment notifications from Ko-fi (donations, subscriptions, shop orders).
 * Data arrives as application/x-www-form-urlencoded with a `data` field containing JSON.
 *
 * Ko-fi webhook docs: https://ko-fi.com/manage/webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Shape of the Ko-fi webhook payload (parsed from the `data` JSON field). */
interface KofiPayload {
  verification_token: string;
  message_id: string;
  timestamp: string;
  type: "Donation" | "Subscription" | "Commission" | "Shop Order";
  is_public: boolean;
  from_name: string;
  message: string | null;
  amount: string;
  url: string;
  email: string;
  currency: string;
  is_subscription_payment: boolean;
  is_first_subscription_payment: boolean;
  kofi_transaction_id: string;
  shop_items: Array<{ direct_link_code: string }> | null;
  tier_name: string | null;
  shipping: unknown | null;
}

/**
 * Send a notification to Discord admin channel via webhook.
 */
async function notifyDiscord(payload: KofiPayload): Promise<void> {
  const webhookUrl = process.env.DISCORD_ADMIN_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const isFirst = payload.is_first_subscription_payment;
    const isSub = payload.is_subscription_payment;
    const name = payload.is_public ? payload.from_name : "Anonymous";

    const color = isSub ? 0x2ecc71 : 0xe67e22; // green for subs, orange for tips
    const title = isFirst
      ? `New Subscriber: ${name}`
      : isSub
        ? `Recurring Payment: ${name}`
        : `New Tip: ${name}`;

    const fields = [
      { name: "Amount", value: `${payload.amount} ${payload.currency}`, inline: true },
      { name: "Type", value: payload.type, inline: true },
    ];

    if (payload.tier_name) {
      fields.push({ name: "Tier", value: payload.tier_name, inline: true });
    }

    if (payload.message && payload.is_public) {
      fields.push({ name: "Message", value: payload.message, inline: false });
    }

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title,
          color,
          fields,
          footer: { text: "Ko-fi Webhook" },
          timestamp: payload.timestamp,
        }],
      }),
    });
  } catch (error) {
    console.error("[Ko-fi] Discord notification error:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ko-fi sends application/x-www-form-urlencoded with a `data` field
    const formData = await request.formData();
    const dataField = formData.get("data");

    if (!dataField || typeof dataField !== "string") {
      return NextResponse.json({ error: "Missing data field" }, { status: 400 });
    }

    let payload: KofiPayload;
    try {
      payload = JSON.parse(dataField);
    } catch {
      return NextResponse.json({ error: "Invalid JSON in data field" }, { status: 400 });
    }

    // Verify token
    const expectedToken = process.env.KOFI_VERIFICATION_TOKEN;
    if (!expectedToken || payload.verification_token !== expectedToken) {
      return NextResponse.json({ error: "Invalid verification token" }, { status: 401 });
    }

    // Deduplicate by message_id
    const existing = await db.kofiTransaction.findUnique({
      where: { messageId: payload.message_id },
    });

    if (existing) {
      // Already processed — return 200 so Ko-fi doesn't retry
      return NextResponse.json({ ok: true, duplicate: true });
    }

    // Store transaction
    await db.kofiTransaction.create({
      data: {
        messageId: payload.message_id,
        type: payload.type,
        amount: parseFloat(payload.amount),
        currency: payload.currency,
        fromName: payload.from_name,
        email: payload.email || null,
        tierName: payload.tier_name || null,
        isFirstPayment: payload.is_first_subscription_payment,
        isSubscription: payload.is_subscription_payment,
        isPublic: payload.is_public,
        message: payload.message || null,
        kofiTransactionId: payload.kofi_transaction_id || null,
      },
    });

    console.log(
      `[Ko-fi] ${payload.type} from ${payload.from_name}: ${payload.amount} ${payload.currency}` +
        (payload.tier_name ? ` (tier: ${payload.tier_name})` : "")
    );

    // Notify admin Discord channel via webhook
    await notifyDiscord(payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Ko-fi] Webhook error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}

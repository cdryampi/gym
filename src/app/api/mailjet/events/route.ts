import { NextResponse } from "next/server";

import { markPickupRequestEmailResult } from "@/lib/cart/member-bridge";
import { getMailjetEventToken } from "@/lib/env";

type MailjetEvent = Record<string, unknown>;

function asString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseEventPayload(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const payload = JSON.parse(value) as Record<string, unknown>;
    const pickupRequestId = asString(payload.pickupRequestId);
    const deliveryKind = asString(payload.deliveryKind);

    if (!pickupRequestId || (deliveryKind !== "customer" && deliveryKind !== "internal")) {
      return null;
    }

    return {
      pickupRequestId,
      deliveryKind,
    };
  } catch {
    return null;
  }
}

function parseCampaign(value: string | null) {
  if (!value) {
    return null;
  }

  const match = value.match(/^pickup_request_(.+)_(customer|internal)$/);

  if (!match) {
    return null;
  }

  return {
    pickupRequestId: match[1],
    deliveryKind: match[2] as "customer" | "internal",
  };
}

function parseCustomId(value: string | null) {
  if (!value) {
    return null;
  }

  const match = value.match(/^pickup-request:(.+):(customer|internal)$/);

  if (!match) {
    return null;
  }

  return {
    pickupRequestId: match[1],
    deliveryKind: match[2] as "customer" | "internal",
  };
}

function resolvePickupReference(event: MailjetEvent) {
  return (
    parseEventPayload(
      asString(event.EventPayload) ??
        asString(event.eventpayload) ??
        asString(event.Payload) ??
        asString(event.payload),
    ) ??
    parseCustomId(asString(event.CustomID) ?? asString(event.custom_id)) ??
    parseCampaign(asString(event.customcampaign))
  );
}

function isFailureEvent(eventName: string) {
  return ["bounce", "blocked", "spam", "unsub", "dropped"].includes(eventName);
}

function isSuccessEvent(eventName: string) {
  return ["sent", "processed", "delivered"].includes(eventName);
}

function buildEventErrorMessage(eventName: string, event: MailjetEvent) {
  const smtpReply =
    asString(event.error_related_to) ??
    asString(event.error) ??
    asString(event.comment) ??
    asString(event.mj_message_id);

  return smtpReply ? `Mailjet ${eventName}: ${smtpReply}` : `Mailjet ${eventName}.`;
}

function resolveEventTime(event: MailjetEvent) {
  const unixSeconds = asNumber(event.time);

  if (unixSeconds === null) {
    return new Date().toISOString();
  }

  return new Date(unixSeconds * 1000).toISOString();
}

export async function POST(request: Request) {
  const configuredToken = getMailjetEventToken();
  const requestUrl = new URL(request.url);
  const requestToken = requestUrl.searchParams.get("token");

  if (configuredToken && requestToken !== configuredToken) {
    return NextResponse.json({ error: "Unauthorized Mailjet webhook." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const events = Array.isArray(body) ? body : body ? [body] : [];
  let processed = 0;

  for (const rawEvent of events) {
    if (!rawEvent || typeof rawEvent !== "object") {
      continue;
    }

    const event = rawEvent as MailjetEvent;
    const eventName = asString(event.event)?.toLowerCase();
    const pickupReference = resolvePickupReference(event);

    if (!eventName || !pickupReference || pickupReference.deliveryKind !== "customer") {
      continue;
    }

    if (isFailureEvent(eventName)) {
      await markPickupRequestEmailResult(pickupReference.pickupRequestId, {
        emailStatus: "failed",
        emailError: buildEventErrorMessage(eventName, event),
      });
      processed += 1;
      continue;
    }

    if (isSuccessEvent(eventName)) {
      await markPickupRequestEmailResult(pickupReference.pickupRequestId, {
        emailStatus: "sent",
        emailSentAt: resolveEventTime(event),
      });
      processed += 1;
    }
  }

  return NextResponse.json({ ok: true, processed });
}

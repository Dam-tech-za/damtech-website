import type { SupabaseClient } from "@supabase/supabase-js";

export async function writeQuoteEvent(
  client: SupabaseClient,
  input: {
    quoteId: string;
    eventType: string;
    actorType: "admin" | "customer" | "system";
    actorUserId?: string | null;
    metadata?: Record<string, unknown> | null;
  },
): Promise<void> {
  const { error } = await client.from("quote_events").insert({
    quote_id: input.quoteId,
    event_type: input.eventType,
    actor_type: input.actorType,
    actor_user_id: input.actorUserId ?? null,
    metadata: input.metadata ?? null,
  });
  if (error) {
    console.error("[quote-event]", error.message);
  }
}

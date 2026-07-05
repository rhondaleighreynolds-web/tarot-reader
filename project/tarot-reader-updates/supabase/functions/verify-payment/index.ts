import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Stripe is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { sessionId } = await req.json() as { sessionId: string };

    if (!sessionId || typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
      return new Response(
        JSON.stringify({ paid: false, error: "Invalid session ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify with Stripe that the session was actually paid
    const stripeRes = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      { headers: { Authorization: `Bearer ${stripeKey}` } }
    );

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error("Stripe session retrieval error:", session);
      return new Response(
        JSON.stringify({ paid: false, error: session.error?.message ?? "Stripe verification failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ paid: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const spreadType = session.metadata?.spreadType as string | undefined;

    // Mark session as used — prevents replay attacks.
    // The UNIQUE constraint on session_id means a duplicate raises code 23505.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: insertError } = await supabase
      .from("payment_sessions")
      .insert({ session_id: sessionId, spread_type: spreadType ?? "unknown" });

    if (insertError) {
      if (insertError.code === "23505") {
        // Duplicate — this session was already redeemed
        return new Response(
          JSON.stringify({ paid: false, error: "This payment session has already been used" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw insertError;
    }

    return new Response(
      JSON.stringify({ paid: true, spreadType }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-payment error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

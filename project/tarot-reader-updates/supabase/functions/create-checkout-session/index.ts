import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ── Payment config ────────────────────────────────────────────────────────────
// To change prices or labels, edit this object.
// Keys must match the SpreadType values used in the frontend ('three', 'celtic').
const SPREAD_PAYMENT_CONFIG: Record<
  string,
  { name: string; description: string; priceInCents: number; currency: string }
> = {
  three: {
    name: "3-Card Tarot Reading",
    description: "Past · Present · Future spread",
    priceInCents: 500,
    currency: "usd",
  },
  celtic: {
    name: "5-Card Tarot Reading",
    description: "Five-Card Cross spread",
    priceInCents: 900,
    currency: "usd",
  },
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

    const body = await req.json() as { spreadType: string; returnUrl: string };
    const { spreadType, returnUrl } = body;

    const config = SPREAD_PAYMENT_CONFIG[spreadType];
    if (!config) {
      return new Response(
        JSON.stringify({ error: `Unknown spread type: ${spreadType}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!returnUrl || !returnUrl.startsWith("http")) {
      return new Response(
        JSON.stringify({ error: "returnUrl is required and must be a valid URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const params = new URLSearchParams({
      mode: "payment",
      success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}&spread=${spreadType}`,
      cancel_url: `${returnUrl}?cancelled=true`,
      "line_items[0][price_data][currency]": config.currency,
      "line_items[0][price_data][product_data][name]": config.name,
      "line_items[0][price_data][product_data][description]": config.description,
      "line_items[0][price_data][unit_amount]": String(config.priceInCents),
      "line_items[0][quantity]": "1",
      "metadata[spreadType]": spreadType,
    });

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const stripeData = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error("Stripe error:", stripeData);
      return new Response(
        JSON.stringify({ error: stripeData.error?.message ?? "Stripe request failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ url: stripeData.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

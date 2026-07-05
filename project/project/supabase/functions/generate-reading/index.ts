import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CardOrientation {
  keywords: string[];
  theme: string;
  shadow: string;
  reframe: string;
  advice: string;
  closing: string;
}

interface TarotCard {
  id: string;
  name: string;
  arcana: string;
  suit: string | null;
  number: number;
  upright: CardOrientation;
  reversed: CardOrientation;
}

interface DrawnCardInput {
  card: TarotCard;
  orientation: "upright" | "reversed";
  position: string;
}

interface ReadingSummary {
  narrative: string;
  theme: string;
  shadow: string;
  advice: string[];
  closing: string;
}

// ── Positivity-safe local engine ─────────────────────────────────────────────

function buildLocalSummary(cards: DrawnCardInput[]): ReadingSummary {
  const readings = cards.map((dc) =>
    dc.orientation === "upright" ? dc.card.upright : dc.card.reversed
  );

  // Theme: first card sets the tone, qualified by the last
  const theme =
    readings.length === 1
      ? readings[0].theme
      : `${readings[0].theme} As this unfolds, ${readings[readings.length - 1].theme.toLowerCase()}`;

  // Shadow: middle card's shadow or first reversed card's shadow
  const reversedReading = cards
    .filter((dc) => dc.orientation === "reversed")
    .map((dc) => dc.card.reversed)[0];
  const shadow = reversedReading
    ? reversedReading.shadow
    : readings[Math.floor(readings.length / 2)]?.shadow ?? readings[0].shadow;

  // Advice: one step per card, max 3
  const advice = readings.slice(0, 3).map((r) => r.advice);

  // Closing: most uplifting — prefer last upright card, else last card
  const uprightCards = cards.filter((dc) => dc.orientation === "upright");
  const closingCard =
    uprightCards.length > 0
      ? uprightCards[uprightCards.length - 1]
      : cards[cards.length - 1];
  const closing = (
    closingCard.orientation === "upright"
      ? closingCard.card.upright
      : closingCard.card.reversed
  ).closing;

  // Fallback narrative (used if AI call fails)
  const cardNames = cards.map((dc) => dc.card.name).join(", ");
  const keywordSample = readings
    .flatMap((r) => r.keywords)
    .slice(0, 4)
    .join(", ");
  const narrative = `Your spread of ${cardNames} speaks to a moment shaped by ${keywordSample}. ${readings[0].reframe} ${closing}`;

  return { narrative, theme, shadow, advice, closing };
}

// ── Groq narrative generator ──────────────────────────────────────────────────

function buildGroqPrompt(cards: DrawnCardInput[]): string {
  const lines = cards.map((dc, i) => {
    const r = dc.orientation === "upright" ? dc.card.upright : dc.card.reversed;
    return [
      `Card ${i + 1} — ${dc.card.name} (${dc.orientation}, position: ${dc.position})`,
      `  Theme: ${r.theme}`,
      `  Reframe: ${r.reframe}`,
      `  Keywords: ${r.keywords.join(", ")}`,
    ].join("\n");
  });

  return [
    "You are a warm, non-dogmatic tarot reader who speaks directly and gently.",
    "",
    "Positivity-safe rules (mandatory):",
    "- Never predict specific negative events.",
    "- Frame every challenge as an invitation to grow.",
    "- Use empowering language: 'you may', 'this invites you to', 'something is asking'.",
    "- Never use deterministic language: 'you will', 'you cannot', 'this means X will happen'.",
    "- End with agency and possibility, not resolution.",
    "",
    "Cards drawn:",
    lines.join("\n\n"),
    "",
    "Write a 2–3 sentence narrative that weaves these cards into one coherent story. Speak directly to the person in second person. Output ONLY the narrative — no labels, no JSON, no quotation marks.",
  ].join("\n");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { cards } = (await req.json()) as { cards: DrawnCardInput[] };

    if (!Array.isArray(cards) || cards.length === 0) {
      return new Response(
        JSON.stringify({ error: "cards array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Always build the local summary first (instant, deterministic)
    const local = buildLocalSummary(cards);

    // Attempt Groq narrative enrichment
    const groqKey = Deno.env.get("Groq_API_Key");
    if (groqKey) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama3-70b-8192",
            max_tokens: 256,
            temperature: 0.75,
            messages: [{ role: "user", content: buildGroqPrompt(cards) }],
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const aiNarrative = groqData?.choices?.[0]?.message?.content?.trim();
          if (aiNarrative && aiNarrative.length > 20) {
            local.narrative = aiNarrative;
          }
        } else {
          console.error("Groq error:", groqRes.status, await groqRes.text());
        }
      } catch (groqErr) {
        console.error("Groq call failed, using local narrative:", groqErr);
      }
    }

    return new Response(JSON.stringify({ summary: local }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-reading error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

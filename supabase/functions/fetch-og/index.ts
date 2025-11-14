import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    const apiKey = Deno.env.get("OPENGRAPH_API_KEY");

    const ogRes = await fetch(
      `https://opengraph.io/api/1.1/site/${encodeURIComponent(
        url,
      )}?app_id=${apiKey}&accept_lang=fr&auto_proxy=true`,
    );
    const json = await ogRes.json();

    const hybrid = json.hybridGraph || {};
    const inferred = json.htmlInferred || {};

    // --------- TEXTES ----------
    const title =
      inferred.title ||
      inferred["og:title"] ||
      hybrid.title ||
      hybrid["og:title"] ||
      null;

    let description =
      inferred.description ||
      inferred["og:description"] ||
      hybrid.description ||
      hybrid["og:description"] ||
      null;

    if (description) {
      description = description.replace(/\s+/g, " ").trim();
    }

    // --------- IMAGE ----------
    const image =
      inferred.image ||
      inferred["og:image"] ||
      hybrid.image ||
      hybrid["og:image"] ||
      null;

    // --------- PRIX ----------
    let price = null;
    const products = inferred.products || hybrid.products || [];
    if (products?.length > 0) {
      const offers = products[0].offers;
      if (offers?.length > 0) {
        price = Number(offers[0].price);
      }
    }

    // --------- SPECIFICATIONS ----------
    const specs =
      products?.[0]?.specifications ||
      inferred.specifications ||
      hybrid.specifications ||
      [];

    let color = null;
    let size = null;

    for (const spec of specs) {
      const key = spec.key.toLowerCase();

      // 🎨 Couleur
      if (!color && key.includes("couleur")) {
        color = String(spec.value).replace("‎", "").trim();
      }

      // 📏 Taille / dimensions / capacité
      if (
        !size &&
        (
          key.includes("taille") ||
          key.includes("capacité") ||
          key.includes("format") ||
          key.includes("dimension")
        )
      ) {
        size = String(spec.value).replace("‎", "").trim();
      }
    }

    // Fallback couleur depuis description si manquant
    if (!color && description) {
      const match = description.match(
        /\b(Noir|Blanc|Rouge|Bleu|Vert|Rose|Gris|Beige|Jaune|Transparent|Transparente)\b/i,
      );
      if (match) color = match[0];
    }

    const payload = {
      title,
      description,
      image,
      price,
      color,
      size,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

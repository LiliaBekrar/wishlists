import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function extractMeta(html: string, key: string): string | null {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    'i'
  );
  const match = html.match(regex);
  return match?.[1] ?? null;
}

serve(async (req) => {
  // ✅ Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  try {
    const body = await req.json();
    const url = body?.url as string | undefined;

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'URL manquante ou invalide' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log('🔵 fetch-og — récupération de', url);

    const pageRes = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      },
    });

    if (!pageRes.ok) {
      console.error('❌ Erreur HTTP sur la page cible:', pageRes.status, pageRes.statusText);
      return new Response(
        JSON.stringify({ error: 'Impossible de récupérer la page cible' }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const html = await pageRes.text();

    const title =
      extractMeta(html, 'og:title') ||
      extractMeta(html, 'twitter:title') ||
      extractMeta(html, 'title');

    const description =
      extractMeta(html, 'og:description') ||
      extractMeta(html, 'twitter:description') ||
      extractMeta(html, 'description');

    const image =
      extractMeta(html, 'og:image') ||
      extractMeta(html, 'twitter:image');

    const priceStr =
      extractMeta(html, 'product:price:amount') ||
      extractMeta(html, 'og:price:amount') ||
      null;

    const price = priceStr ? Number(parseFloat(priceStr)) : null;

    const payload = {
      title: title ?? null,
      description: description ?? null,
      image: image ?? null,
      price: Number.isFinite(price) ? price : null,
    };

    console.log('✅ fetch-og — payload renvoyé:', payload);

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('❌ fetch-og — erreur interne:', err);
    return new Response(
      JSON.stringify({ error: 'Erreur interne' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

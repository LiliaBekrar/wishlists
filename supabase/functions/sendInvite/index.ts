// @ts-nocheck
// 📄 supabase/functions/sendInvite/index.ts
// 🧠 Invite un utilisateur à rejoindre une wishlist via l’e-mail intégré Supabase
// 📄 supabase/functions/sendInvite/index.ts (VERSION FINALE)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type, origin',
      },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const body = await req.json();
    const { wishlistId, email } = body;

    if (!wishlistId || !email) {
      throw new Error('Missing wishlistId or email');
    }

    const { data: wishlist, error: wlError } = await supabase
      .from('wishlists')
      .select('id, name, slug, owner_id')
      .eq('id', wishlistId)
      .single();

    if (wlError || !wishlist) throw new Error('Wishlist not found');
    if (wishlist.owner_id !== user.id) throw new Error('Not authorized');

    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173';
    const redirectUrl = `${appUrl}/list/${wishlist.slug}?invited=true`;

    console.log('📧 Inviting:', email, 'to wishlist:', wishlist.name);
    console.log('🔗 Redirect URL:', redirectUrl);

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: redirectUrl,
      }
    );

    if (inviteError) {
      console.error('❌ Invite error:', inviteError);
      throw new Error(`Invitation failed: ${inviteError.message}`);
    }

    console.log('✅ Invitation sent via Supabase Auth!');

    // Ajouter dans wishlist_members
    await supabase
      .from('wishlist_members')
      .upsert({
        wishlist_id: wishlistId,
        user_id: inviteData.user?.id || null,
        email: email,
        role: 'viewer',
        status: 'invité',
      }, {
        onConflict: 'wishlist_id,email'
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation sent successfully'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

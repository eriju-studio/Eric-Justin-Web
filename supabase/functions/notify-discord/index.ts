import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 1. 這裡的 Headers 是解決截圖中 ERR_FAILED 的唯一方法
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // 2. 這是處理瀏覽器 Preflight 的關鍵，必須回傳 200 或 ok
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id } = await req.json();
    const WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_URL');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!WEBHOOK_URL || !order_id) throw new Error('Missing parameters');

    const supabaseAdmin = createClient(SUPABASE_URL ?? '', SERVICE_ROLE ?? '', {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders').select('*').eq('id', order_id).single();

    if (orderError || !order) throw new Error('Order not found');

    // 發送 Discord
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: "🆕 收到新訂單",
          fields: [
            { name: "ID", value: `${order.id}` },
            { name: "客戶", value: `${order.user_name}` },
            { name: "金額", value: `NT$ ${order.total_amount}` }
          ]
        }]
      })
    });

    return new Response(JSON.stringify({ status: 'success' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // 這裡用 200 確保前端能抓到 JSON 內容
    });
  }
})
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 增加型別定義，防止 Build 失敗
    const body: { 
      order_id: string; 
      name: string; 
      phone: string; 
      total: number; 
      items: string; 
    } = await req.json();

    const { order_id, name, phone, total, items } = body;

    // 關鍵：使用後端環境變數 (不加 NEXT_PUBLIC_)
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!discordWebhookUrl) {
      console.error("❌ 錯誤: Vercel 未設定 DISCORD_WEBHOOK_URL");
      return NextResponse.json({ success: false, error: "Webhook URL missing" }, { status: 500 });
    }

    const embedMessage = {
      username: "Eriju Order Bot",
      embeds: [{
        title: "🛒 新訂單成立！",
        color: 0x0f172a, // 深色主題
        fields: [
          { name: "訂單編號", value: `\`${order_id}\``, inline: false },
          { name: "客戶名稱", value: name, inline: true },
          { name: "聯絡電話", value: phone, inline: true },
          { name: "訂單總額", value: `**NT$ ${total.toLocaleString()}**`, inline: false },
          { name: "購買清單", value: items }
        ],
        footer: { text: "Eriju Studio Checkout System" },
        timestamp: new Date().toISOString()
      }]
    };

    const response = await fetch(discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embedMessage)
    });

    if (!response.ok) throw new Error('Discord API 響應錯誤');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
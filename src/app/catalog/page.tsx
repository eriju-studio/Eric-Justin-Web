"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import gsap from "gsap";
import confetti from "canvas-confetti";

export default function CartPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shippingMethod, setShippingMethod] = useState<"store" | "home">("store");
  const [form, setForm] = useState({ name: "", phone: "", storeInfo: "", address: "" });
  const [showNotice, setShowNotice] = useState(false);

  // 1. 核心抓取邏輯：確保圖片對接正確
  const fetchCartData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return setLoading(false);

    // 第一步：從 cart 抓 ID 與 數量
    const { data: cartData } = await supabase
      .from("cart")
      .select("product_id, quantity")
      .eq("user_id", session.user.id);

    if (cartData && cartData.length > 0) {
      const pIds = cartData.map(i => i.product_id);

      // 第二步：從 products 抓圖片網址、名稱、價格
      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, price, image_url")
        .in("id", pIds);

      // 第三步：手動組合成完整物件
      const merged = cartData.map(item => {
        const prod = productsData?.find(p => p.id === item.product_id);
        
        // 處理圖片路徑（去除多餘斜線並抓取公開網址）
        let finalImageUrl = "";
        if (prod?.image_url) {
          const cleanPath = prod.image_url.trim().replace(/^\/+/, "");
          const { data } = supabase.storage.from("assets").getPublicUrl(cleanPath);
          finalImageUrl = data.publicUrl;
        }

        return {
          id: item.product_id, // 商品 ID
          qty: item.quantity,
          name: prod?.name || "未定義商品",
          price: prod?.price || 0,
          image: finalImageUrl
        };
      });
      setCart(merged);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCartData();
    gsap.fromTo(".reveal", { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1 });
  }, []);

  // 2. 數量更新與刪除功能
  const updateQty = async (id: string, newQty: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (newQty <= 0) {
      // 刪除商品
      setCart(prev => prev.filter(item => item.id !== id));
      await supabase.from("cart").delete().eq("user_id", session.user.id).eq("product_id", id);
      return;
    }

    // 更新數量
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: newQty } : item));
    await supabase.from("cart").update({ quantity: newQty }).eq("user_id", session.user.id).eq("product_id", id);
  };

  // 3. 訂購按鈕（煙火 + 通知）
  const handleOrder = () => {
    if (!form.name || !form.phone || !form.address) {
      alert("請填寫完整的收件資訊");
      return;
    }

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#000000', '#ff4d00', '#ffffff']
    });

    setShowNotice(true);
    setTimeout(() => setShowNotice(false), 4000);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#fcfcfc]">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
      <div className="font-black text-slate-400 text-[10px] uppercase tracking-[0.5em]">讀取清單中...</div>
    </div>
  );

  return (
    <div className="bg-[#fcfcfc] min-h-screen pt-32 pb-24 text-slate-900 selection:bg-black selection:text-white">
      {showNotice && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[5000] bg-black text-white px-10 py-5 rounded-full font-black italic shadow-2xl animate-bounce">
          訂購成功！感謝您的支持 🎆
        </div>
      )}

      <main className="max-w-3xl mx-auto px-6">
        <header className="reveal mb-12">
          <h1 className="text-6xl font-black tracking-tighter italic leading-none uppercase">Checkout.</h1>
        </header>

        {/* 商品列表（包含數量調整與刪除） */}
        <div className="space-y-4 mb-16">
          {cart.map((item) => (
            <div key={item.id} className="reveal bg-white p-6 flex gap-6 items-center rounded-[35px] border border-black/[0.03] shadow-sm">
              <div className="w-24 h-24 bg-slate-50 rounded-[24px] overflow-hidden flex-shrink-0 flex items-center justify-center">
                {item.image ? (
                  <img src={item.image} className="w-full h-full object-contain p-2" alt="" />
                ) : (
                  <div className="text-[10px] font-black text-slate-300">NO IMG</div>
                )}
              </div>
              
              <div className="flex-grow">
                <h3 className="font-black text-xl italic uppercase leading-none mb-3">{item.name}</h3>
                <div className="flex items-center bg-slate-100 w-fit rounded-full p-1">
                  <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-8 h-8 font-black hover:bg-white rounded-full transition-all flex items-center justify-center text-sm">
                    {item.qty === 1 ? "✕" : "-"}
                  </button>
                  <span className="w-10 text-center font-black text-sm">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-8 h-8 font-black hover:bg-white rounded-full transition-all flex items-center justify-center text-sm">+</button>
                </div>
              </div>

              <div className="text-2xl font-black italic tracking-tighter">
                ${(item.price * item.qty).toLocaleString()}
              </div>
            </div>
          ))}
          {cart.length === 0 && <div className="text-center py-20 font-black italic text-slate-300">購物車是空的</div>}
        </div>

        {/* 配送表單（手動填寫） */}
        <section className="reveal bg-white p-10 space-y-8 rounded-[45px] border border-black/[0.03] shadow-sm">
          <div className="flex bg-slate-100 p-2 rounded-[28px]">
            <button onClick={() => setShippingMethod("store")} className={`flex-1 py-4 rounded-[22px] text-xs font-black transition-all ${shippingMethod === "store" ? "bg-white shadow-md" : "text-slate-400"}`}>7-11 取貨</button>
            <button onClick={() => setShippingMethod("home")} className={`flex-1 py-4 rounded-[22px] text-xs font-black transition-all ${shippingMethod === "home" ? "bg-white shadow-md" : "text-slate-400"}`}>宅配到府</button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="姓名" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-6 bg-slate-50 rounded-[25px] font-bold outline-none ring-black focus:ring-2" />
            <input type="tel" placeholder="電話" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-6 bg-slate-50 rounded-[25px] font-bold outline-none ring-black focus:ring-2" />
          </div>

          {shippingMethod === "store" ? (
            <div className="space-y-4">
              <input type="text" placeholder="7-11 門市名稱" value={form.storeInfo} onChange={e => setForm({...form, storeInfo: e.target.value})} className="w-full p-6 bg-slate-50 rounded-[25px] font-bold outline-none ring-black focus:ring-2" />
              <input type="text" placeholder="門市地址或店號" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full p-6 bg-slate-50 rounded-[25px] font-bold outline-none ring-black focus:ring-2" />
            </div>
          ) : (
            <input type="text" placeholder="完整收件地址" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full p-7 bg-slate-50 rounded-[28px] font-bold outline-none ring-black focus:ring-2" />
          )}
        </section>

        {/* 結帳與煙火按鈕 */}
        <button 
          onClick={handleOrder}
          className="reveal mt-12 w-full py-10 bg-black text-white rounded-[45px] font-black text-2xl uppercase tracking-[0.2em] hover:bg-[#ff4d00] transition-all active:scale-95 shadow-2xl"
        >
          總計 ${(cart.reduce((s, i) => s + (i.price * i.qty), 0)).toLocaleString()} — 確認訂購
        </button>
      </main>
    </div>
  );
}
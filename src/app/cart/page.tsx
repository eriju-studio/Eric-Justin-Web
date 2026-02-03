"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import gsap from "gsap";
import Link from "next/link";
import confetti from "canvas-confetti";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<"store" | "home">("store");
  
  const [form, setForm] = useState({
    name: "",
    phone: "",
    storeInfo: "", // 7-11 門市名稱
    address: ""    // 地址或店號
  });

  // 強化圖片抓取
  const getImageUrl = (path: string) => {
    if (!path || path === "null" || path === "") return null;
    if (path.startsWith("http")) return path;
    const cleanPath = path.trim().replace(/^\/+/, "");
    const { data } = supabase.storage.from("assets").getPublicUrl(cleanPath);
    return data.publicUrl;
  };

  useEffect(() => {
    // 【修正】強制恢復 Body 滾動，防止被其他頁面的樣式鎖死
    document.body.style.overflow = "auto";
    document.body.style.height = "auto";

    const initPage = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const currentUser = session.user;
        setUser(currentUser);
        setForm(f => ({ 
          ...f, 
          name: currentUser.user_metadata?.full_name || "" 
        }));

        const { data: dbCart, error } = await supabase
          .from("cart")
          .select(`
            quantity,
            product_id,
            products ( id, name, price, original_price, image_url )
          `)
          .eq("user_id", currentUser.id);

        if (!error && dbCart) {
          const formattedCart = dbCart.map((item: any) => ({
            id: item.product_id,
            qty: item.quantity,
            name: item.products.name,
            price: item.products.price,
            original_price: item.products.original_price,
            image: getImageUrl(item.products.image_url)
          }));
          setCart(formattedCart);
        }
      } else {
        const savedCart = JSON.parse(localStorage.getItem("ej_cart") || "[]");
        setCart(savedCart);
      }
      
      setLoading(false);
      
      setTimeout(() => {
        gsap.fromTo(".reveal", 
          { y: 15, opacity: 0 }, 
          { y: 0, opacity: 1, stagger: 0.08, duration: 0.6, ease: "expo.out" }
        );
      }, 50);
    };

    initPage();
  }, []);

  const updateQty = async (id: any, delta: number) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;

    const newQty = Math.max(1, item.qty + delta);
    gsap.fromTo(`#item-${id}`, { scale: 1 }, { scale: 1.02, duration: 0.1, yoyo: true, repeat: 1 });

    if (user) {
      await supabase.from('cart').update({ quantity: newQty }).eq('user_id', user.id).eq('product_id', id);
    }

    const newCart = cart.map(i => i.id === id ? { ...i, qty: newQty } : i);
    setCart(newCart);
    localStorage.setItem("ej_cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("storage"));
  };

  const removeItem = (id: any) => {
    gsap.to(`#item-${id}`, {
      x: -20, opacity: 0, scale: 0.95, duration: 0.4,
      onComplete: () => {
        (async () => {
          if (user) {
            await supabase.from('cart').delete().eq('user_id', user.id).eq('product_id', id);
          }
          const newCart = cart.filter(item => item.id !== id);
          setCart(newCart);
          localStorage.setItem("ej_cart", JSON.stringify(newCart));
          window.dispatchEvent(new Event("storage"));
        })();
      }
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const runSuccessRitual = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#000000', '#ff4d00', '#ffffff']
    });

    setShowSuccess(true);
    setTimeout(() => {
      const tl = gsap.timeline();
      tl.to(".success-overlay", { opacity: 1, duration: 0.6, ease: "power3.out" })
      .fromTo(".success-check", 
        { scale: 0, rotate: -30, opacity: 0 }, 
        { scale: 1, rotate: 0, opacity: 1, duration: 0.8, ease: "back.out(2)" }
      )
      .to(".success-overlay", { 
        opacity: 0, 
        duration: 0.8, 
        delay: 2,
        onComplete: () => { router.push("/orders"); }
      });
    }, 10);
  };

  const processOrder = async () => {
    if (!user || !form.name || !form.phone || !form.address) {
      alert("請完整填寫收件資訊");
      return;
    }

    setIsProcessing(true);
    
    const finalAddress = shippingMethod === "store" 
      ? `【7-11 ${form.storeInfo}】${form.address}`
      : form.address;

    const orderData = {
      user_name: form.name,
      user_email: user.email,
      user_phone: form.phone,
      shipping_address: finalAddress,
      items: cart,
      total_amount: subtotal,
      status: 'pending'
    };

    try {
      const { data: newOrder, error } = await supabase.from('orders').insert([orderData]).select().single();
      if (error) throw error;

      const itemsString = cart.map(item => `- ${item.name} x ${item.qty}`).join('\n');

      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: newOrder.id,
          name: form.name,
          email: user.email,
          phone: form.phone,
          address: finalAddress,
          total: subtotal,
          items: itemsString,
          status: "pending"
        }),
      }).catch(err => console.error("通知失敗:", err));

      localStorage.removeItem('ej_cart');
      await supabase.from('cart').delete().eq('user_id', user.id);
      window.dispatchEvent(new Event("storage"));

      runSuccessRitual();

    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      alert("訂單送出失敗：" + err.message);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#fcfcfc]">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
      <div className="font-black text-slate-400 text-[10px] uppercase tracking-[0.5em]">讀取清單中...</div>
    </div>
  );

  return (
    // 【修正】移除外層過多的 overflow 限制，改用 touch-auto
    <div className="bg-[#fcfcfc] min-h-screen pt-32 pb-24 text-slate-900 touch-auto">
      
      {/* 【修正】只有 showSuccess 為真才渲染這塊，徹底防止透明遮罩攔截點擊 */}
      {showSuccess && (
        <div className="success-overlay fixed inset-0 z-[2000] bg-white/95 backdrop-blur-2xl flex flex-col items-center justify-center opacity-0">
          <div className="success-check w-32 h-32 bg-slate-900 rounded-full flex items-center justify-center shadow-2xl">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 className="mt-12 text-4xl font-black italic tracking-tighter uppercase">Order Confirmed.</h2>
          <p className="mt-3 text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">感謝您的收藏，正在為您準備</p>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-6 relative z-10">
        <header className="reveal mb-12">
          <span className="text-[10px] font-black tracking-[0.4em] text-amber-600 uppercase block mb-4">Final Check</span>
          <h1 className="text-5xl font-black tracking-tighter italic">確認您的訂單。</h1>
        </header>

        {cart.length === 0 ? (
          <div className="reveal py-32 text-center">
            <p className="text-slate-300 font-black text-2xl mb-8 tracking-tighter italic">購物袋目前是空的。</p>
            <Link href="/catalog" className="inline-block bg-slate-900 text-white px-12 py-4 rounded-full font-black text-xs tracking-[0.2em] hover:bg-amber-600 transition-all uppercase">返回商店</Link>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-16">
              {cart.map((item) => (
                <div key={item.id} id={`item-${item.id}`} className="reveal bg-white p-6 flex gap-6 items-center rounded-[32px] border border-black/[0.06] shadow-sm group hover:shadow-md transition-all">
                  <div className="w-24 h-24 bg-white rounded-2xl overflow-hidden flex-shrink-0 p-1 border border-slate-50">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-black text-slate-900 text-xl leading-tight uppercase italic">{item.name}</h3>
                    <div className="flex items-center gap-5 mt-4">
                      <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                        <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center font-bold text-slate-400 hover:text-slate-900">-</button>
                        <span className="w-8 text-center text-sm font-black">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center font-bold text-slate-400 hover:text-slate-900">+</button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-[10px] text-slate-400 font-black uppercase hover:text-red-500 transition underline underline-offset-4">移除品項</button>
                    </div>
                  </div>
                  <div className="text-right font-black text-slate-900 text-lg tracking-tighter">
                    NT$ {(item.price * item.qty).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <section className="reveal space-y-8 mb-16">
              <h2 className="text-2xl font-black tracking-tight italic underline underline-offset-8 decoration-slate-200 uppercase">Shipping Info.</h2>
              
              <div className="flex bg-slate-100 p-1.5 rounded-[24px]">
                <button onClick={() => setShippingMethod("store")} className={`flex-1 py-3.5 rounded-[18px] text-[10px] font-black tracking-widest transition-all ${shippingMethod === "store" ? "bg-white shadow-sm" : "text-slate-400"}`}>7-11 取貨</button>
                <button onClick={() => setShippingMethod("home")} className={`flex-1 py-3.5 rounded-[18px] text-[10px] font-black tracking-widest transition-all ${shippingMethod === "home" ? "bg-white shadow-sm" : "text-slate-400"}`}>宅配到府</button>
              </div>

              <div className="bg-white p-8 space-y-6 rounded-[35px] border border-black/[0.06] shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.2em]">收件人 Name</label>
                    <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="請輸入姓名" className="w-full p-5 bg-slate-50 rounded-[22px] text-sm font-bold outline-none border border-transparent focus:border-black transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.2em]">聯絡電話 Phone</label>
                    <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="09xxxxxxxx" className="w-full p-5 bg-slate-50 rounded-[22px] text-sm font-bold outline-none border border-transparent focus:border-black transition-all" />
                  </div>
                </div>

                {shippingMethod === "store" ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="bg-amber-50/50 p-6 rounded-[28px] border border-amber-100/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-grow">
                        <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-[0.2em] mb-1">E-MAP 查詢</h4>
                        <p className="text-[11px] text-amber-700/80 font-bold leading-relaxed">點擊右側開啟 7-11 地圖查詢門市名稱，<br/>查完後請於下方輸入資訊。</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => window.open("https://emap.pcsc.com.tw/", "711Emap", "width=1000,height=800")}
                        className="bg-white text-slate-900 px-6 py-3 rounded-full text-[10px] font-black shadow-sm hover:bg-amber-600 hover:text-white transition-all active:scale-95 uppercase"
                      >
                        開啟官方地圖
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.2em]">7-11 門市名稱 Store Name</label>
                      <input type="text" value={form.storeInfo} onChange={e => setForm({...form, storeInfo: e.target.value})} placeholder="例如：XX門市" className="w-full p-5 bg-slate-50 rounded-[22px] text-sm font-bold outline-none border border-transparent focus:border-black transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.2em]">門市地址或店號 Store Address</label>
                      <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="請輸入地址或 6 位店號" className="w-full p-5 bg-slate-50 rounded-[22px] text-sm font-bold outline-none border border-transparent focus:border-black transition-all" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-500">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.2em]">寄送地址 Address</label>
                    <textarea rows={3} value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="請輸入完整配送地址" className="w-full p-5 bg-slate-50 rounded-[22px] text-sm font-bold outline-none border border-transparent focus:border-black transition-all resize-none" />
                  </div>
                )}
              </div>
            </section>

            <section className="reveal border-t border-slate-100 pt-10 space-y-4">
              <div className="flex justify-between text-4xl md:text-5xl font-black px-2">
                <span className="tracking-tighter">總計</span>
                <span className="tracking-tighter italic">NT$ {subtotal.toLocaleString()}</span>
              </div>

              <button 
                onClick={processOrder}
                disabled={isProcessing || !user}
                className={`w-full py-8 rounded-[35px] font-black text-lg mt-12 uppercase tracking-[0.3em] transition-all duration-500 shadow-xl ${
                  isProcessing || !user 
                  ? 'bg-slate-100 text-slate-300' 
                  : 'bg-slate-900 text-white hover:bg-[#ff4d00]'
                }`}
              >
                {!user ? "請先登入帳號" : isProcessing ? "處理中..." : "送出訂單 — ORDER"}
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
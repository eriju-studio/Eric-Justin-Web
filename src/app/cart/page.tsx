"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import gsap from "gsap";
import Link from "next/link";

export default function CartPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex flex-col items-center justify-center bg-[#fcfcfc]">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
      </div>
    }>
      <CartContent />
    </Suspense>
  );
}

function CartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // 新增：物流方式狀態
  const [shippingMethod, setShippingMethod] = useState<"post" | "711">("post");
  
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: ""
  });

  const getImageUrl = (path: string) => {
    if (!path || path === "null" || path === "") return null;
    if (path.startsWith("http")) return path;
    const { data } = supabase.storage.from("assets").getPublicUrl(path);
    return data.publicUrl;
  };

  // 監聽綠界回傳
  useEffect(() => {
    const storeName = searchParams.get("storeName");
    const storeId = searchParams.get("storeId");
    if (storeName && storeId) {
      setShippingMethod("711");
      setForm(prev => ({ ...prev, address: `【7-11取貨】${storeName} (${storeId})` }));
      // 清除網址參數
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  const openECPayMap = () => {
    const formEl = document.createElement("form");
    formEl.method = "POST";
    formEl.action = "https://logistics-stage.ecpay.com.tw/Express/map";
    formEl.target = "_self"; 

    const fields = {
      MerchantID: "2000132",
      LogisticsType: "CVS",
      LogisticsSubType: "EMAP",
      IsCollection: "N",
      ServerReplyURL: `${window.location.origin}/api/store-reply`,
    };

    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      formEl.appendChild(input);
    });

    document.body.appendChild(formEl);
    formEl.submit();
    document.body.removeChild(formEl);
  };

  useEffect(() => {
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
          localStorage.setItem("ej_cart", JSON.stringify(formattedCart));
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
      const { error } = await supabase
        .from('cart')
        .update({ quantity: newQty })
        .eq('user_id', user.id)
        .eq('product_id', id);
      
      if (error) {
        alert(error.message);
        return;
      }
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
    setShowSuccess(true);
    setTimeout(() => {
      const tl = gsap.timeline();
      tl.to(".success-overlay", { opacity: 1, duration: 0.6, ease: "power3.out" })
      .fromTo(".success-check", 
        { scale: 0, rotate: -30, opacity: 0 }, 
        { scale: 1, rotate: 0, opacity: 1, duration: 0.8, ease: "back.out(2)" }
      )
      .fromTo(".firework", 
        { scale: 0, opacity: 0 }, 
        { scale: 2.5, opacity: 1, stagger: 0.1, duration: 0.8, ease: "expo.out" }, 
        "-=0.5"
      )
      .to(".success-overlay", { 
        opacity: 0, 
        duration: 0.8, 
        delay: 1.5,
        onComplete: () => { router.push("/orders"); }
      });
    }, 10);
  };

  const processOrder = async () => {
    if (!user || !form.name || !form.phone || !form.address) {
      alert("請完整填寫收件資訊與運送地址");
      return;
    }

    setIsProcessing(true);
    
    const orderData = {
      user_name: form.name,
      user_email: user.email,
      user_phone: form.phone,
      shipping_address: form.address,
      items: cart,
      total_amount: subtotal,
      status: 'pending'
    };

    try {
      const { data, error } = await supabase.from('orders').insert([orderData]).select().single();
      if (error) throw error;

      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: data.id, 
          name: form.name,
          email: user.email,
          phone: form.phone,
          address: form.address,
          total: subtotal,
          items: cart.map(i => `• ${i.name} x ${i.qty}`).join('\n')
        })
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
    <div className="bg-[#fcfcfc] min-h-screen pt-32 pb-24 text-slate-900 overflow-x-hidden">
      
      {showSuccess && (
        <div className="success-overlay fixed inset-0 z-[2000] bg-white/95 backdrop-blur-2xl flex flex-col items-center justify-center opacity-0">
          <div className="relative flex items-center justify-center">
            <div className="firework absolute top-0 left-0 w-3 h-3 bg-amber-400 rounded-full blur-[2px]" />
            <div className="firework absolute bottom-10 right-10 w-4 h-4 bg-orange-500 rounded-full blur-[2px]" />
            <div className="firework absolute -top-20 right-10 w-2 h-2 bg-yellow-300 rounded-full blur-[1px]" />
            <div className="firework absolute bottom-0 -left-20 w-5 h-5 bg-slate-200 rounded-full blur-[3px]" />
            <div className="success-check w-32 h-32 bg-slate-900 rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
          <h2 className="mt-12 text-4xl font-black italic tracking-tighter">Order Confirmed.</h2>
          <p className="mt-3 text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">感謝您的收藏，正在為您準備</p>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-6">
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
                <div key={item.id} id={`item-${item.id}`} className="reveal bg-white p-6 flex gap-6 items-center rounded-[32px] border border-black/[0.06] shadow-sm group hover:shadow-md transition-all duration-500">
                  <div className="w-24 h-24 bg-white rounded-2xl overflow-hidden flex-shrink-0 p-1 border border-slate-50 group-hover:scale-105 transition-transform duration-700">
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
                      <button onClick={() => removeItem(item.id)} className="text-[10px] text-slate-400 font-black uppercase hover:text-red-500 transition underline underline-offset-4 decoration-1">移除品項</button>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    {item.original_price && item.original_price > item.price && (
                      <span className="text-[10px] text-slate-400 line-through font-bold mb-1 italic">
                        NT$ {(item.original_price * item.qty).toLocaleString()}
                      </span>
                    )}
                    <div className="font-black text-slate-900 text-lg tracking-tighter">
                      NT$ {(item.price * item.qty).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <section className="reveal space-y-8 mb-16">
              <h2 className="text-2xl font-black tracking-tight italic underline underline-offset-8 decoration-slate-200">收件資訊。</h2>
              
              <div className="bg-white p-8 space-y-8 rounded-[35px] border border-black/[0.06] shadow-sm">
                
                {/* 物流選擇器 */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.2em]">運送方式 Method</label>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => { setShippingMethod("post"); setForm({...form, address: ""}); }}
                      className={`flex-1 py-4 rounded-2xl font-black text-xs tracking-widest transition-all ${shippingMethod === "post" ? "bg-slate-900 text-white shadow-lg" : "bg-slate-50 text-slate-400"}`}
                    >
                      🏠 郵寄
                    </button>
                    <button 
                      onClick={() => setShippingMethod("711")}
                      className={`flex-1 py-4 rounded-2xl font-black text-xs tracking-widest transition-all ${shippingMethod === "711" ? "bg-slate-900 text-white shadow-lg" : "bg-slate-50 text-slate-400"}`}
                    >
                      🏪 7-11 取貨
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.2em]">收件人姓名 Recipient</label>
                    <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="請輸入姓名" className="w-full p-5 bg-slate-50 border border-transparent rounded-[22px] text-sm font-bold outline-none focus:bg-white focus:border-slate-900 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.2em]">聯絡電話 Phone</label>
                    <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="09xx-xxx-xxx" className="w-full p-5 bg-slate-50 border border-transparent rounded-[22px] text-sm font-bold outline-none focus:bg-white focus:border-slate-900 transition-all" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.2em]">
                    {shippingMethod === "post" ? "寄送地址 Shipping Address" : "門市資訊 Store"}
                  </label>
                  
                  {shippingMethod === "post" ? (
                    <textarea 
                      rows={3} 
                      value={form.address} 
                      onChange={e => setForm({...form, address: e.target.value})} 
                      placeholder="請輸入完整地址" 
                      className="w-full p-5 bg-slate-50 border border-transparent rounded-[22px] text-sm font-bold outline-none focus:bg-white focus:border-slate-900 transition-all resize-none" 
                    />
                  ) : (
                    <div className="space-y-4">
                      {form.address ? (
                        <div className="flex items-center justify-between bg-slate-900 text-white p-5 rounded-[22px] shadow-xl animate-in fade-in zoom-in duration-500">
                          <div className="font-bold text-sm tracking-tight">{form.address}</div>
                          <button onClick={openECPayMap} className="text-[10px] font-black uppercase bg-white/10 px-3 py-1 rounded-lg hover:bg-white/20 transition-all">更換門市</button>
                        </div>
                      ) : (
                        <button 
                          onClick={openECPayMap}
                          className="w-full p-10 border-2 border-dashed border-slate-200 rounded-[22px] text-slate-400 font-bold text-sm hover:border-slate-900 hover:text-slate-900 transition-all bg-slate-50/50"
                        >
                          + 點擊開啟地圖選擇門市
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="reveal border-t border-slate-100 pt-10 space-y-4">
              <div className="flex justify-between text-slate-400 text-[11px] font-black tracking-widest uppercase px-2">
                <span>小計 Subtotal</span>
                <span className="text-slate-900">NT$ {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-4xl md:text-5xl font-black mt-6 px-2">
                <span className="tracking-tighter">總計</span>
                <span className="tracking-tighter italic">NT$ {subtotal.toLocaleString()}</span>
              </div>

              <button 
                onClick={processOrder}
                disabled={isProcessing || !user || !form.address}
                className={`w-full py-7 rounded-[32px] font-black text-lg mt-12 uppercase tracking-[0.3em] transition-all duration-700 shadow-xl ${
                  isProcessing || !user || !form.address
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                  : 'bg-slate-900 text-white hover:bg-[#d98b5f]'
                }`}
              >
                {!user ? "請先登入帳號" : isProcessing ? "訂單處理中..." : "送出訂單"}
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
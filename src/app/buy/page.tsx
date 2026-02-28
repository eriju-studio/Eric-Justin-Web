"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import gsap from "gsap";
import Lenis from "lenis";

// --- 子組件：規格確認面板 ---
function SpecPanel({ isOpen, onClose, qty, setQty, agreed, setAgreed, price, onConfirm }: any) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
  }, [isOpen]);

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[1050] transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl bg-white shadow-[0_-10px_50px_rgba(0,0,0,0.2)] rounded-t-[40px] z-[1100] transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="p-10 md:p-16 pb-20">
          <header className="flex justify-between items-center mb-12">
            <div>
              <h3 className="text-xs font-black tracking-[0.3em] uppercase text-slate-900 mb-1">訂購確認</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest italic font-bold">Order Confirmation</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:text-black hover:bg-slate-300 transition-all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </header>

          <div className="flex items-center justify-between mb-10 p-6 bg-slate-100 rounded-3xl border border-slate-200">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">選購數量</span>
              <span className="text-[9px] text-slate-400 uppercase font-bold">Quantity</span>
            </div>
            <div className="flex items-center gap-8">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 flex items-center justify-center text-xl font-bold hover:scale-125 transition-transform text-slate-400 hover:text-black">-</button>
              <span className="text-2xl font-black tabular-nums italic text-slate-900">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="w-8 h-8 flex items-center justify-center text-xl font-bold hover:scale-125 transition-transform text-slate-400 hover:text-black">+</button>
            </div>
          </div>

          <div className="mb-12 px-2">
            <div className="mb-4">
              <h4 className="text-[10px] font-black text-slate-900 tracking-[0.2em] uppercase mb-1">Notice / 免責聲明</h4>
            </div>
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="relative flex items-center mt-1">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-full checked:bg-[#d98b5f] checked:border-[#d98b5f] transition-all" />
                <svg className="absolute w-3 h-3 text-white left-1 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <span className="text-[11px] text-slate-600 leading-relaxed tracking-tight font-bold group-hover:text-black transition-colors">
                我已了解此為個人創作專案之測試性販售，非公司行號。下單即表示理解本專案仍在早期階段，出貨時間與細節可能依實際狀況調整。
              </span>
            </label>
          </div>

          <div className="flex justify-between items-end mb-12 px-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">預計總額</span>
              <span className="text-[9px] text-slate-300 uppercase font-bold">Subtotal</span>
            </div>
            <span className="text-4xl font-black italic tracking-tighter text-slate-900">NT$ {(price * qty).toLocaleString()}</span>
          </div>

          <button onClick={onConfirm} disabled={!agreed} className={`w-full py-8 rounded-full font-black text-[11px] uppercase tracking-[0.6em] transition-all duration-200 shadow-xl ${agreed ? 'bg-black text-white hover:bg-[#d98b5f] active:scale-[0.95]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
            確認加入購物袋
          </button>
        </div>
      </div>
    </>
  );
}

function BuyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("id");

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [isSpecOpen, setIsSpecOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const getImageUrl = (path: string) => {
    if (!path || path === "null" || path === "") return null;
    if (path.startsWith("http")) return path;
    const { data } = supabase.storage.from("assets").getPublicUrl(path);
    return data.publicUrl;
  };

  useEffect(() => {
    const lenis = new Lenis();
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    const fetchProduct = async () => {
      if (!productId) return;
      const { data, error } = await supabase.from("products").select("*").eq("id", productId).single();
      if (!error && data) {
        setProduct(data);
        setLoading(false);
        gsap.fromTo(".reveal-item", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.1 });
      }
    };
    fetchProduct();
    return () => lenis.destroy();
  }, [productId]);

  const images = product ? [product.image_url, product.image_url2, product.image_url3].map(getImageUrl).filter(Boolean) : [];

  const moveSlide = (dir: number) => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: dir * sliderRef.current.clientWidth, behavior: "smooth" });
    }
  };

  const handleConfirm = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    let cart = JSON.parse(localStorage.getItem("ej_cart") || "[]");
    const idx = cart.findIndex((item: any) => item.id === product.id);
    const totalQty = idx > -1 ? cart[idx].qty + qty : qty;
    if (user) {
      await supabase.from('cart').upsert({ user_id: user.id, product_id: product.id, quantity: totalQty }, { onConflict: 'user_id, product_id' });
    }
    if (idx > -1) { cart[idx].qty = totalQty; } 
    else { cart.push({ id: product.id, name: product.name, price: product.price, image: getImageUrl(product.image_url), qty: totalQty }); }
    localStorage.setItem("ej_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
    router.push("/cart");
  };

  return (
    <div className="bg-white min-h-screen pt-32 pb-40 text-slate-900 relative">
      
      {/* 1. 頂部主要區塊 */}
      <main className={`max-w-[1400px] mx-auto px-10 lg:grid lg:grid-cols-[1.2fr_0.8fr] gap-20 items-start transition-opacity duration-300 ${!loading ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* 左側：商品輪播 */}
        <div className="reveal-item relative group">
          {/* 切換按鈕 */}
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between z-40 pointer-events-none">
            <button onClick={() => moveSlide(-1)} className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white hover:text-[#d98b5f] transition-all pointer-events-auto shadow-xl">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button onClick={() => moveSlide(1)} className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white hover:text-[#d98b5f] transition-all pointer-events-auto shadow-xl">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>

          {/* 圖片滑動區域 */}
          <div ref={sliderRef} className="flex aspect-square overflow-x-auto snap-x snap-mandatory scrollbar-hide no-scrollbar bg-slate-50 rounded-[40px]" onScroll={() => { if(sliderRef.current) setCurrentSlide(Math.round(sliderRef.current.scrollLeft / sliderRef.current.clientWidth)); }}>
            {images.map((url: any, i: number) => (
              <div key={i} className="flex-none w-full h-full snap-start flex items-center justify-center p-6 md:p-10">
                <img src={url} alt="" className="max-w-full max-h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-105" />
              </div>
            ))}
          </div>

          {/* 底部小圖導覽 */}
          <div className="flex gap-4 mt-8 justify-center">
            {images.map((url: any, i: number) => (
              <button key={i} onClick={() => sliderRef.current?.scrollTo({ left: i * sliderRef.current.clientWidth, behavior: 'smooth' })} className={`w-16 h-16 rounded-2xl border-2 transition-all overflow-hidden bg-white p-2 ${i === currentSlide ? 'border-[#d98b5f] scale-110 shadow-md' : 'border-slate-200 opacity-50 hover:opacity-100'}`}>
                <img src={url} className="w-full h-full object-contain" alt="" />
              </button>
            ))}
          </div>
        </div>

        {/* 右側：固定資訊欄 (Sticky) */}
        <div className="mt-16 lg:mt-0 lg:sticky lg:top-32 space-y-12">
          <section className="reveal-item">
            <span className="text-slate-400 font-black text-[10px] tracking-[0.5em] uppercase mb-4 block italic">{product?.tag || "系列選品"}</span>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[0.85] mb-10 uppercase italic">{product?.name}</h1>
            <div className="flex items-baseline gap-6">
              <span className="text-5xl font-black italic tracking-tighter text-slate-900">NT$ {product?.price.toLocaleString()}</span>
            </div>
          </section>

          <section className="reveal-item pt-10 border-t border-slate-200">
            <h4 className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-400 mb-6 italic">產品簡介 / Description</h4>
            <p className="text-slate-500 text-base leading-relaxed font-bold italic whitespace-pre-line">{product?.description}</p>
          </section>

          <button onClick={() => setIsSpecOpen(true)} className="reveal-item w-full py-9 bg-black text-white rounded-full font-black text-[11px] uppercase tracking-[0.6em] shadow-2xl hover:bg-[#d98b5f] transition-all active:scale-95">
            立即加入購物袋
          </button>
        </div>
      </main>

      {/* 2. 下方詳情長圖區 */}
      <section className="mt-40 border-t border-slate-100 pt-32 bg-[#fafafa]">
        <div className="max-w-[1100px] mx-auto px-6 pb-40 text-center">
          
          <div className="mb-24 reveal-item">
            <h2 className="text-xs font-black tracking-[0.5em] text-slate-400 uppercase mb-4 italic">Product Details</h2>
            <p className="text-3xl font-black italic text-slate-900 uppercase tracking-tighter">商品細節展示</p>
          </div>
          
          <div className="reveal-item w-full rounded-[48px] overflow-hidden shadow-2xl bg-white mb-20">
            {/* 動態讀取 detail_image_url，若無則顯示第一張主圖 */}
            <img 
              src={getImageUrl(product?.detail_image_url) || getImageUrl(product?.image_url)} 
              alt="Detail View" 
              className="w-full h-auto block"
            />
          </div>

          <div className="reveal-item max-w-2xl mx-auto mt-20 border-t border-slate-200 pt-20">
             <p className="text-[15px] text-slate-500 leading-loose font-bold italic whitespace-pre-line">
                {product?.detail}
             </p>
          </div>
          
        </div>
      </section>

      <SpecPanel isOpen={isSpecOpen} onClose={() => setIsSpecOpen(false)} qty={qty} setQty={setQty} agreed={agreed} setAgreed={setAgreed} price={product?.price || 0} onConfirm={handleConfirm} />
    </div>
  );
}

export default function BuyPage() {
  return (
    <Suspense fallback={null}>
      <BuyContent />
    </Suspense>
  );
}
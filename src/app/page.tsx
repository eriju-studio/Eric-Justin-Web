"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

export default function HomePage() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // 滑鼠追蹤
    const glow = document.getElementById("cursor-glow");
    const handleMouseMove = (e: MouseEvent) => {
      gsap.to(glow, {
        x: e.clientX - 300,
        y: e.clientY - 300,
        duration: 1.5,
        ease: "power2.out",
      });
    };

    // 元素動畫
    gsap.utils.toArray(".reveal").forEach((el: any) => {
      gsap.to(el, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 92%",
        },
      });
    });

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative">
      {/* 鼠標光暈背景 */}
      <div className="glow-bg" id="cursor-glow"></div>

      {/* --- Hero Section (保留原樣) --- */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] -z-10 opacity-40"></div>
        
        <div className="reveal opacity-0 translate-y-10 max-w-4xl">
          <div className="gold-tag mx-auto w-fit mb-8 px-4 py-1 border border-amber-200 bg-amber-50 text-amber-700 text-xs font-bold rounded-full tracking-widest uppercase">OFFICIAL RELEASE</div>
          <h1 className="hero-title text-7xl md:text-[140px] mb-8 text-slate-900 font-black tracking-tighter leading-[0.9]">
            02 / 04
          </h1>
          <p className="text-slate-400 text-xl md:text-2xl max-w-2xl mx-auto mb-12 font-medium">
            正式啟程。這不只是發售，而是一場關於生活質感的重新校準。
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/catalog" className="btn-luxury group">
              立即預購
              <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </Link>
            <span className="text-slate-300 font-mono tracking-tighter uppercase">EST. 2026 / TAIWAN</span>
          </div>
        </div>
      </section>

      {/* --- 系列 Section (保留原樣) --- */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-black tracking-tighter mb-4 reveal opacity-0 translate-y-10 uppercase text-slate-900">
            新品系列
          </h2>
          <div className="w-12 h-1 bg-slate-900 mx-auto mb-24 reveal opacity-0 translate-y-10"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* 卡片 1 */}
            <Link href="/catalog" className="reveal opacity-0 translate-y-10 release-card group block">
              <div className="aspect-[4/5] overflow-hidden bg-slate-50 relative">
                <Image
                  src="https://oikubhlwdbxrfhifqusn.supabase.co/storage/v1/object/public/assets/calssic.png"
                  alt="經典系列"
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
              </div>
              <div className="p-10 text-left flex justify-between items-end">
                <div className="flex-1">
                  <h3 className="text-3xl font-black mb-3 text-slate-900">經典系列</h3>
                  <p className="text-slate-400">極致質感，卻不失溫度。</p>
                </div>
                <div className="w-14 h-14 rounded-full border border-slate-100 flex items-center justify-center text-2xl group-hover:bg-slate-900 group-hover:text-white transition-all text-slate-900">
                  →
                </div>
              </div>
            </Link>

            {/* 卡片 2 */}
            <Link href="/catalog" className="reveal opacity-0 translate-y-10 release-card group block">
              <div className="aspect-[4/5] overflow-hidden bg-slate-50 relative">
                <Image
                  src="https://oikubhlwdbxrfhifqusn.supabase.co/storage/v1/object/public/assets/3.png"
                  alt="專業系列"
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
              </div>
              <div className="p-10 text-left flex justify-between items-end">
                <div className="flex-1">
                  <h3 className="text-3xl font-black mb-3 text-slate-900">專業</h3>
                  <p className="text-slate-400">為你量身打造。</p>
                </div>
                <div className="w-14 h-14 rounded-full border border-slate-100 flex items-center justify-center text-2xl group-hover:bg-slate-900 group-hover:text-white transition-all text-slate-900">
                  →
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* --- 故事 Section (修正裁切與語法) --- */}
      <section className="py-24 bg-[#fcfcfc]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="reveal opacity-0 translate-y-10 relative overflow-hidden rounded-[40px] md:rounded-[60px] bg-[#1a1a1a] aspect-[4/5] md:aspect-[16/7] min-h-[550px] md:min-h-[450px] flex items-end group shadow-2xl border border-white/5">
            
            {/* 背景圖層 */}
            <div className="absolute inset-0 z-0">
              {/* 手機版：針對手機比例優化中心點 */}
              <div className="md:hidden relative w-full h-full">
                <Image 
                  src="https://oikubhlwdbxrfhifqusn.supabase.co/storage/v1/object/public/assets/phone.png" 
                  alt="Eriju Mobile" 
                  fill 
                  className="object-cover object-[75%_center] transition-transform duration-[7s] group-hover:scale-105" 
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
              </div>

              {/* 電腦版：保持右側重心 */}
              <div className="hidden md:block relative w-full h-full">
                <Image 
                  src="https://oikubhlwdbxrfhifqusn.supabase.co/storage/v1/object/public/assets/about%20photo.png" 
                  alt="Eriju Desktop" 
                  fill 
                  className="object-cover object-right transition-transform duration-[7s] group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent"></div>
              </div>
            </div>

            {/* 內容區 */}
            <div className="relative z-20 p-10 md:p-20 w-full">
              <Link href="/about" className="inline-flex items-center gap-4 md:gap-6 text-white font-bold group/link">
                <span className="text-sm border-b-2 border-white/40 pb-1 group-hover/link:border-white transition-all uppercase tracking-[0.2em]">
                  探索故事
                </span>
                <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center group-hover/link:bg-white group-hover/link:text-black transition-all duration-500">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
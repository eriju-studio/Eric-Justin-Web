"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

export default function HomePage() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

   //滑鼠追蹤
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
        duration: 0.2,
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

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* 背景網格 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] -z-10 opacity-40"></div>
        
        <div className="reveal opacity-0 translate-y-10 max-w-4xl">
          <div className="gold-tag mx-auto w-fit mb-8">OFFICIAL RELEASE</div>
          <h1 className="hero-title text-7xl md:text-[140px] mb-8 text-slate-900 font-black tracking-tighter leading-[0.9]">
            02 / 04
          </h1>
          <p className="text-slate-400 text-xl md:text-2xl max-w-2xl mx-auto mb-12 font-medium">
            正式啟程。這不只是發售，而是一場關於生活質感的重新校準。
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/catalog" className="btn-luxury group">
              立即預購
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <span className="text-slate-300 font-mono tracking-tighter">EST. 2026 / TAIWAN</span>
          </div>
        </div>
      </section>

      {/* --- 系列 Section --- */}
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
                  alt="可愛小卡系列"
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all">
                    立即查看
                  </div>
                </div>
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
                  alt="專業聲學配飾"
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all">
                    立即查看
                  </div>
                </div>
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

      {/* 故事 Section */}
      <section className="py-24 bg-[#fcfcfc]">
        <div className="max-w-7xl mx-auto px-6">
          {/* 加入 shadow-[0_0_50px_-12px_rgba(255,255,255,0.3)] 產生基礎外發光 */}
          <div className="reveal relative overflow-hidden rounded-[40px] md:rounded-[60px] bg-[#1a1a1a] aspect-[21/9] min-h-[400px] flex items-center group shadow-2xl hover:shadow-orange-500/10 transition-shadow duration-700 border border-white/5">
            
            {/* 背景圖 */}
            <div className="absolute inset-0 opacity-100">
              <Image 
                src="https://oikubhlwdbxrfhifqusn.supabase.co/storage/v1/object/public/assets/about%20photo.png" 
                alt="Eriju Background" 
                fill 
                className="w-full h-full object-cover object-right transition-transform duration-[7s] group-hover:scale-105" 
              />
            </div>

            {/* 漸層遮罩：微調透明度讓質感更通透 */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent z-10"></div>

            {/* 文字內容 */}
            <div className="relative z-20 p-10 md:p-24 max-w-2xl text-left">
              {/* 1. 標籤發光：加入 drop-shadow-glow */}
              <span className="text-orange-500 font-black text-[10px] md:text-xs tracking-[0.5em] uppercase mb-6 block drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]">
                INTRODUCTION
              </span>
              
              {/* 2. 標題微光：讓白色文字帶點呼吸感 */}
              <h2 className="text-white text-5xl md:text-7xl font-black mb-10 leading-[1.05] tracking-tighter italic drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                關於 Eriju<br />
                <span className="text-white/60 not-italic font-light">的不妥協。</span>
              </h2>
              
              {/* 3. 按鈕發光：圓圈 Hover 時產生強烈光暈 */}
              <Link href="/about" className="inline-flex items-center gap-6 text-white font-bold group/link">
                <span className="text-sm border-b-2 border-white/40 pb-1 group-hover/link:border-white transition-all uppercase tracking-widest">
                  探索故事
                </span>
                <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center group-hover/link:bg-white group-hover/link:text-black group-hover/link:shadow-[0_0_20px_rgba(255,255,255,0.6)] transition-all duration-500">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              </Link>
            </div>

            {/* 額外點綴：右上角的一抹極弱微光，增加層次感 */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 blur-[100px] rounded-full pointer-events-none"></div>
          </div>
        </div>
      </section>
    </div>
  );
}
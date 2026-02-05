"use client";

// @ts-nocheck
import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// --- 類型定義 ---
type Order = {
  id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  shipping_address: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'delivered' | 'completed' | 'cancelled' | 'cancelling';
  items: any[];
  created_at: string;
  cancel_reason?: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  status: boolean;
  image_url: string;
  description?: string;
};

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "ERIJUSTUDIO99";
// 在此填入你的 Webhook 網址
const DISCORD_WEBHOOK_URL = ""; 

export default function AdminPage() {
  const [isLocked, setIsLocked] = useState(true);
  const [passwordInput, setPasswordInput] = useState("");
  const [mainTab, setMainTab] = useState<"orders" | "products">("orders");
  const [orderSubTab, setOrderSubTab] = useState<string>("all"); 
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const sendDC = async (msg: string) => {
    if (!DISCORD_WEBHOOK_URL) return;
    try {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `🛠️ **管理後台通知**\n${msg}` }),
      });
    } catch (e) { console.error(e); }
  };

  const fetchData = useCallback(async () => {
    const { data: ord, error: oErr } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    const { data: prd, error: pErr } = await supabase.from("products").select("*").order("id", { ascending: false });
    if (ord) setOrders(ord);
    if (prd) setProducts(prd);
  }, []);

  useEffect(() => {
    const auth = window.localStorage.getItem("admin_auth_status");
    if (auth === "true") {
      setIsLocked(false);
      fetchData();
    }
  }, [fetchData]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      window.localStorage.setItem("admin_auth_status", "true");
      setIsLocked(false);
      fetchData();
    } else {
      alert("密碼錯誤，請重新輸入");
    }
  };

  const saveProduct = async () => {
    if (!editingProduct?.name) return alert("請輸入產品名稱");
    
    const { id, ...updateData } = editingProduct;
    let error;

    if (id) {
      const { error: err } = await supabase.from("products").update(updateData).eq("id", id);
      error = err;
    } else {
      const { error: err } = await supabase.from("products").insert([updateData]);
      error = err;
    }

    if (error) {
      alert(`操作失敗：${error.message}\n請確認資料庫權限是否正常。`);
    } else {
      sendDC(`🖼️ 作品更新：**${editingProduct.name}** 已成功存檔`);
      setIsModalOpen(false);
      fetchData();
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("確定要永久刪除此作品嗎？此操作無法還原。")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) alert(`刪除失敗: ${error.message}`);
    else {
      sendDC(`🗑️ 已從作品庫移除作品 (ID: ${id})`);
      fetchData();
    }
  };

  const updateOrderStatus = async (order: Order, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", order.id);
    if (error) alert(error.message);
    else {
      sendDC(`📦 訂單 [${order.user_name}] 狀態更新為：**${newStatus}**`);
      fetchData();
    }
  };

  const displayOrders = orderSubTab === "all" 
    ? orders 
    : orders.filter(o => o.status === orderSubTab);

  if (isLocked) {
    return (
      <div className="fixed inset-0 z-[10000] bg-slate-950 flex items-center justify-center p-6 text-white">
        <form onSubmit={handleUnlock} className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-6 flex items-center justify-center text-black font-black italic text-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)]">E</div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-4">Eriju Studio Security</p>
          <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full bg-slate-900 border border-slate-800 p-5 rounded-2xl text-center font-black tracking-widest focus:outline-none focus:border-white/50 transition-all" placeholder="請輸入安全金鑰" autoFocus />
          <button className="w-full bg-white text-black py-4 mt-4 rounded-2xl font-black uppercase hover:bg-orange-500 hover:text-white transition-all duration-300">解除鎖定</button>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f8f9fa] overflow-y-auto flex flex-col font-sans text-slate-900">
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="font-black italic text-xl tracking-tighter">ERIJU 管理系統</div>
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setMainTab("orders")} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${mainTab === "orders" ? "bg-white shadow-sm" : "text-slate-400"}`}>訂單處理</button>
            <button onClick={() => setMainTab("products")} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${mainTab === "products" ? "bg-white shadow-sm" : "text-slate-400"}`}>作品管理</button>
          </div>
          <button onClick={() => { window.localStorage.clear(); window.location.reload(); }} className="text-[10px] font-bold text-red-500 uppercase border border-red-100 px-3 py-1 rounded-lg hover:bg-red-50 transition-all">安全登出</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto w-full p-6 py-10">
        {mainTab === "orders" ? (
          <section className="animate-in fade-in duration-500">
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              {['all', 'pending', 'processing', 'delivered', 'completed', 'cancelled', 'cancelling'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setOrderSubTab(tab)}
                  className={`px-5 py-2.5 rounded-full text-[10px] font-black tracking-widest transition-all whitespace-nowrap ${orderSubTab === tab ? 'bg-black text-white' : 'bg-white border text-slate-400 hover:border-slate-300'}`}
                >
                  {tab === 'all' ? '全部訂單' : tab === 'pending' ? '待處理' : tab === 'processing' ? '製作中' : tab === 'delivered' ? '已發貨' : tab === 'completed' ? '已完成' : tab === 'cancelling' ? '取消中' : '已取消'}
                  <span className={`ml-2 px-1.5 py-0.5 rounded ${orderSubTab === tab ? 'bg-white/20' : 'bg-slate-100'}`}>
                    {tab === 'all' ? orders.length : orders.filter(o => o.status === tab).length}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid gap-4">
              {displayOrders.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed rounded-[2.5rem] text-slate-300 font-bold uppercase tracking-widest">目前沒有相關訂單</div>
              ) : (
                displayOrders.map(order => (
                  <div key={order.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-black text-xl italic tracking-tighter">{order.user_name}</span>
                        <span className={`text-[9px] font-black px-2 py-1 rounded uppercase ${order.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-blue-600 mb-4">{order.user_phone} | <span className="text-slate-400">{order.user_email}</span></p>
                      <div className="bg-slate-50 p-4 rounded-2xl text-xs font-bold text-slate-500 mb-4">收件地址：{order.shipping_address}</div>
                      <div className="space-y-1">
                        {order.items.map((item, i) => (
                          <div key={i} className="text-[10px] font-black italic text-slate-400 uppercase">・{item.name} × {item.qty}</div>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex flex-col justify-between items-end">
                      <div>
                        <span className="text-[10px] font-black text-slate-300 uppercase">訂單總金額</span>
                        <div className="text-3xl font-black italic tracking-tighter">NT$ {order.total_amount.toLocaleString()}</div>
                      </div>
                      <div className="flex gap-2 mt-6">
                        {order.status === 'pending' && <button onClick={() => updateOrderStatus(order, 'processing')} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">開始製作</button>}
                        {order.status === 'processing' && <button onClick={() => updateOrderStatus(order, 'delivered')} className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest shadow-lg shadow-green-100 hover:bg-green-700 transition-all">確認發貨</button>}
                        {order.status === 'delivered' && <button onClick={() => updateOrderStatus(order, 'completed')} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest hover:bg-black transition-all">完成結案</button>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        ) : (
          <section className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl font-black italic tracking-tighter uppercase">作品庫管理</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase mt-1">Inventory Control</p>
              </div>
              <button onClick={() => { setEditingProduct({ name: "", price: 0, status: true, image_url: "", description: "" }); setIsModalOpen(true); }} className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs hover:bg-blue-600 transition-all shadow-xl shadow-slate-200">+ 新增作品</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {products.map(p => (
                <div key={p.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden group hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500">
                  <div className="aspect-video bg-slate-100 overflow-hidden relative">
                    <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                    {!p.status && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center font-black italic text-xs uppercase text-slate-600">已下架</div>}
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-black italic uppercase tracking-tighter">{p.name}</h3>
                      <span className="font-black text-slate-400 text-sm">NT$ {p.price.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2 mt-6">
                      <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="flex-1 bg-slate-100 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-black hover:text-white transition-all">編輯詳情</button>
                      <button onClick={() => deleteProduct(p.id)} className="px-4 bg-red-50 text-red-500 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">刪除</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 編輯作品彈窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[20000] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-3xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black italic uppercase mb-8 tracking-tighter">編輯產品資料</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-1 block">產品名稱</label>
                <input type="text" value={editingProduct?.name || ""} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all" placeholder="請輸入產品名稱..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-1 block">售價 (NT$)</label>
                  <input 
                    type="number" 
                    value={editingProduct?.price ?? ""} 
                    onChange={e => {
                      const val = e.target.value;
                      setEditingProduct({...editingProduct, price: val === "" ? 0 : parseInt(val)});
                    }} 
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-1 block">上架狀態</label>
                  <select value={editingProduct?.status ? "true" : "false"} onChange={e => setEditingProduct({...editingProduct, status: e.target.value === "true"})} className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-black appearance-none">
                    <option value="true">發售中 (Active)</option>
                    <option value="false">已存檔 (Archived)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-1 block">圖片連結 (Image URL)</label>
                <input type="text" value={editingProduct?.image_url || ""} onChange={e => setEditingProduct({...editingProduct, image_url: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-black" placeholder="例如: /assets/products/p1.jpg" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-1 block">作品描述</label>
                <textarea rows={3} value={editingProduct?.description || ""} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-black" placeholder="輸入關於這件作品的簡介..." />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={saveProduct} className="flex-1 bg-black text-white py-4 rounded-2xl font-black uppercase shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all duration-300">儲存變更</button>
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-4 bg-slate-100 rounded-2xl font-black uppercase text-slate-400 hover:bg-slate-200 transition-all">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
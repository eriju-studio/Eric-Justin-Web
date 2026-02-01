"use client";

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

export default function AdminPage() {
  const [isLocked, setIsLocked] = useState(true);
  const [passwordInput, setPasswordInput] = useState("");
  const [mainTab, setMainTab] = useState<"orders" | "products">("orders");
  const [orderSubTab, setOrderSubTab] = useState<Order["status"]>("pending");
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // --- 數據獲取 ---
  const fetchData = useCallback(async () => {
    const { data: ord } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    const { data: prd } = await supabase.from("products").select("*").order("id", { ascending: false });
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
      alert("管理密碼錯誤！");
    }
  };

  // --- 狀態更動核心 ---
  const updateOrderStatus = async (order: Order, newStatus: Order["status"]) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", order.id);
    if (error) return alert("更新失敗");
    fetchData();
  };

  // --- 作品操作 ---
  const openEditModal = (product?: Product) => {
    setEditingProduct(product || { name: "", price: 0, status: true, image_url: "", description: "" });
    setIsModalOpen(true);
  };

  const saveProduct = async () => {
    if (!editingProduct?.name) return alert("請輸入名稱");
    
    if (editingProduct.id) {
      const { error } = await supabase.from("products").update(editingProduct).eq("id", editingProduct.id);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.from("products").insert([editingProduct]);
      if (error) alert(error.message);
    }
    setIsModalOpen(false);
    fetchData();
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("確定刪除此作品？此動作無法復原。")) return;
    await supabase.from("products").delete().eq("id", id);
    fetchData();
  };

  const getStatusCount = (status: Order["status"]) => orders.filter(o => o.status === status).length;
  const hasUrgentAction = orders.some(o => o.status === 'pending' || o.status === 'cancelling');

  if (isLocked) {
    return (
      <div className="fixed inset-0 z-[10000] bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-white rounded-[2.5rem] mx-auto mb-8 flex items-center justify-center text-black text-3xl font-black italic shadow-2xl">E</div>
          <form onSubmit={handleUnlock} className="space-y-4">
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="SECRET KEY" className="w-full bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl text-center font-black tracking-widest focus:outline-none focus:border-blue-500" autoFocus />
            <button className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase hover:bg-blue-600 hover:text-white transition-all">解鎖後台</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f8f9fa] overflow-y-auto flex flex-col font-sans antialiased text-slate-900">
      {/* 頂部導覽 */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-black text-sm">E</div>
            <div className="flex flex-col">
              <span className="font-black italic text-lg tracking-tighter uppercase leading-none">Admin HQ</span>
              <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-1">Studio Management</span>
            </div>
          </div>
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button onClick={() => setMainTab("orders")} className={`relative px-8 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${mainTab === "orders" ? "bg-white text-black shadow-md" : "text-slate-400 hover:text-slate-600"}`}>
              訂單管理
              {hasUrgentAction && <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
            </button>
            <button onClick={() => setMainTab("products")} className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${mainTab === "products" ? "bg-white text-black shadow-md" : "text-slate-400 hover:text-slate-600"}`}>作品庫</button>
          </div>
          <button onClick={() => { window.localStorage.removeItem("admin_auth_status"); window.location.reload(); }} className="px-4 py-2 border border-red-100 rounded-xl text-[10px] font-black text-red-500 uppercase hover:bg-red-50 transition-all">Logout</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto w-full p-6 py-12">
        {mainTab === "orders" ? (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 子狀態標籤 */}
            <div className="flex gap-3 mb-12 overflow-x-auto pb-4 scrollbar-hide">
              {(['pending', 'processing', 'cancelling', 'delivered', 'completed', 'cancelled'] as const).map(tab => {
                const count = getStatusCount(tab);
                return (
                  <button 
                    key={tab}
                    onClick={() => setOrderSubTab(tab)}
                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-3 ${orderSubTab === tab ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-300'}`}
                  >
                    {tab === 'pending' ? '待處理' : tab === 'processing' ? '製作中' : tab === 'cancelling' ? '取消申請' : tab === 'delivered' ? '已發貨' : tab === 'completed' ? '已完成' : '已取消'}
                    {count > 0 && <span className={`px-2 py-0.5 rounded-lg text-[9px] ${orderSubTab === tab ? 'bg-white text-black' : 'bg-red-500 text-white'}`}>{count}</span>}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-6">
              {orders.filter(o => o.status === orderSubTab).length === 0 ? (
                <div className="py-48 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                  <p className="text-slate-300 font-black uppercase tracking-[0.5em] italic">No Orders / 目前尚無訂單</p>
                </div>
              ) : (
                orders.filter(o => o.status === orderSubTab).map(order => (
                  <div key={order.id} className={`bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between gap-8 hover:shadow-xl hover:shadow-slate-100 transition-all duration-500 ${order.status === 'cancelling' ? 'ring-2 ring-red-500 bg-red-50/10' : ''}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <h3 className="text-2xl font-black italic tracking-tighter text-slate-900 uppercase">{order.user_name}</h3>
                        <span className="bg-slate-50 text-slate-400 text-[9px] px-3 py-1 rounded-full font-black tracking-widest border border-slate-100">ID: {order.id.slice(0, 8)}</span>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-6">
                           <div className="flex flex-col"><span className="text-[9px] font-black text-slate-300 uppercase">Contact</span><p className="font-bold text-blue-600 text-sm">{order.user_phone}</p></div>
                           <div className="flex flex-col"><span className="text-[9px] font-black text-slate-300 uppercase">Date</span><p className="font-bold text-slate-500 text-sm">{new Date(order.created_at).toLocaleDateString()}</p></div>
                        </div>
                        <div className="bg-slate-50/50 p-5 rounded-2xl text-xs font-bold text-slate-600 border border-slate-100/50">{order.shipping_address}</div>
                      </div>
                      <div className="mt-8 pt-6 border-t border-slate-50">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs font-black italic py-1">
                            <span className="text-slate-400 uppercase">{item.name} <span className="text-slate-300 not-italic">× {item.qty}</span></span>
                            <span className="text-slate-900">NT$ {(item.price * item.qty).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col justify-between items-end min-w-[220px]">
                      <div className="text-right">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Grand Total</span>
                        <p className="text-4xl font-black italic tracking-tighter tabular-nums text-slate-900 mt-1">NT$ {order.total_amount.toLocaleString()}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end mt-8">
                        {order.status === 'pending' && <button onClick={() => updateOrderStatus(order, 'processing')} className="bg-blue-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-100">開始製作</button>}
                        {order.status === 'processing' && <button onClick={() => updateOrderStatus(order, 'delivered')} className="bg-green-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition shadow-lg shadow-green-100">發貨完成</button>}
                        {order.status === 'delivered' && <button onClick={() => updateOrderStatus(order, 'completed')} className="bg-slate-900 text-white px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition">結案</button>}
                        {order.status !== 'completed' && order.status !== 'cancelled' && (
                          <button onClick={() => { if(confirm("確定取消？")) updateOrderStatus(order, 'cancelled') }} className="text-[10px] font-black text-slate-300 hover:text-red-500 transition px-4 py-2">取消訂單</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        ) : (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Archive / 作品庫</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Manage your creative inventory</p>
              </div>
              <button onClick={() => openEditModal()} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-2xl shadow-slate-200 text-xs hover:bg-blue-600 hover:-translate-y-1 transition-all duration-300">+ ADD MASTERPIECE</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.length === 0 ? (
                <div className="col-span-full py-48 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                  <p className="text-slate-300 font-black uppercase tracking-widest italic">Inventory is Empty / 尚未上架作品</p>
                </div>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 flex flex-col">
                    <div className="relative aspect-[5/4] bg-slate-100 overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 font-black italic text-xs">NO VISUAL</div>
                      )}
                      <div className="absolute top-6 left-6">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md ${product.status ? 'bg-green-500/90 text-white' : 'bg-slate-900/80 text-white'}`}>
                          {product.status ? '● In Stock' : '○ Archive'}
                        </span>
                      </div>
                    </div>
                    <div className="p-8 flex-grow flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-tight">{product.name}</h3>
                        <span className="text-lg font-black tabular-nums text-slate-400">NT$ {product.price.toLocaleString()}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] font-medium line-clamp-2 mb-8 flex-grow">{product.description || "No description provided."}</p>
                      <div className="flex gap-2 pt-6 border-t border-slate-50">
                        <button onClick={() => openEditModal(product)} className="flex-1 bg-slate-50 text-slate-900 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">Edit</button>
                        <button onClick={() => deleteProduct(product.id)} className="px-4 bg-red-50 text-red-500 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">Delete</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>

      {/* 🎨 精緻作品編輯 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[20000] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10">
              <div className="flex justify-between items-center mb-10">
                <div className="flex flex-col">
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter">Piece Editor</h2>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Configure Product Metadata</span>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-black transition-colors">✕</button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">作品名稱 Piece Name</label>
                  <input type="text" value={editingProduct?.name || ""} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-slate-900 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">價格 Price (NT$)</label>
                    <input type="number" value={editingProduct?.price || 0} onChange={e => setEditingProduct({...editingProduct, price: parseInt(e.target.value)})} className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-slate-900 transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">狀態 Availability</label>
                    <select value={editingProduct?.status ? "true" : "false"} onChange={e => setEditingProduct({...editingProduct, status: e.target.value === "true"})} className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-slate-900 transition-all">
                      <option value="true">發售中 (In Stock)</option>
                      <option value="false">存檔 (Archive)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">圖片路徑 Image Path</label>
                  <input type="text" value={editingProduct?.image_url || ""} onChange={e => setEditingProduct({...editingProduct, image_url: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-slate-900 transition-all" placeholder="assets/p1.jpg" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">簡介 Description</label>
                  <textarea rows={3} value={editingProduct?.description || ""} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-slate-900 transition-all resize-none" />
                </div>
              </div>

              <div className="mt-12 flex gap-4">
                <button onClick={saveProduct} className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-blue-600 transition-all duration-300">Save Piece</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // 藍新回傳參數名稱與 ezShip/綠界 不同
    const storeName = formData.get('StoreName'); 
    const storeId = formData.get('StoreID');   

    // 取得當前網域
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://eriju.art';
    const redirectUrl = new URL(`${baseUrl}/cart`);
    
    if (storeName) {
      redirectUrl.searchParams.set('storeName', storeName.toString());
      redirectUrl.searchParams.set('storeId', storeId?.toString() || '');
    }

    // 使用 303 Redirect 強制瀏覽器跳轉回購物車
    return NextResponse.redirect(redirectUrl.toString(), 303);
  } catch (error) {
    console.error("Store Reply Error:", error);
    return NextResponse.redirect('http://localhost:3000/cart', 303);
  }
}
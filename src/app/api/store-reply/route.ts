import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. 接收綠界傳來的 FormData
    const formData = await req.formData();
    const storeName = formData.get('CVSStoreName'); // 門市名稱
    const storeId = formData.get('CVSStoreID');     // 門市店號

    // 2. 定義跳轉回購物車的網址，並帶上參數
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://eriju.art';
    const redirectUrl = new URL(`${baseUrl}/cart`);
    
    if (storeName && storeId) {
      redirectUrl.searchParams.set('storeName', storeName.toString());
      redirectUrl.searchParams.set('storeId', storeId.toString());
    }

    // 3. 執行重定向 (303 確保從 POST 轉為 GET)
    return NextResponse.redirect(redirectUrl.toString(), 303);
  } catch (error) {
    console.error('Store Reply Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
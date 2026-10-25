import { supabaseAdmin } from '@/lib/supabase-admin'; // 👈 Swapped to admin client
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// GET: Fetch cart items
export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('cart_session')?.value;

  if (!sessionId) return NextResponse.json({ items: [] });

  // Uses admin master key to read cart items bypassing RLS
  const { data: cartItems, error } = await supabaseAdmin
    .from('cart_items')
    .select(`id, quantity, size, products (id, name, price, images)`)
    .eq('session_id', sessionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = cartItems?.map((item: any) => ({
    id: item.id,
    product_id: item.products.id,
    name: item.products.name,
    price: item.products.price,
    quantity: item.quantity,
    size: item.size,
    image: item.products.images?.[0] || '/feralshirt1.png',
  })) || [];

  return NextResponse.json({ items });
}

// POST: Handles ADDING to cart OR CHECKOUT
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get('cart_session')?.value;

  if (!sessionId) {
    sessionId = uuidv4();
    cookieStore.set('cart_session', sessionId, { httpOnly: true, secure: true, path: '/' });
  }

  const body = await request.json();
  
  // Logic Branch: If the body has a checkout flag, process order
  if (body.action === 'checkout') {
    return await processCheckout(body, sessionId);
  }

  // Otherwise, default to adding to cart
  const { product_id, quantity, size } = body;
  const { data: existing } = await supabaseAdmin
    .from('cart_items')
    .select('id, quantity')
    .eq('session_id', sessionId)
    .eq('product_id', product_id)
    .eq('size', size)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin.from('cart_items').update({ quantity: existing.quantity + quantity }).eq('id', existing.id);
  } else {
    await supabaseAdmin.from('cart_items').insert({ session_id: sessionId, product_id, quantity, size });
  }

  return NextResponse.json({ success: true });
}

// Helper to handle the checkout database push
async function processCheckout(body: any, sessionId: string) {
  const { fullName, email, phone, address, city, items, total, paymentMethod, transactionId, shippingCost } = body;

  const itemsForOrder = items.map((i: any) => ({
    name: i.name,
    size: i.size,
    quantity: i.quantity,
    price: i.price,
    product_id: i.product_id,
  }));

  // Safely inserts order even when RLS is completely locked down to the public
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      order_number: `UNTAMED-${Date.now().toString().slice(-6)}`,
      customer_name: fullName,
      customer_email: email,
      customer_phone: phone,
      customer_address: address,
      city,
      total_amount: total,
      shipping_cost: shippingCost || 0,
      payment_method: paymentMethod,
      payment_status: 'pending',
      transaction_id: transactionId,
      session_id: sessionId,
      items: itemsForOrder,
    })
    .select('id, order_number')
    .single();

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });

  await supabaseAdmin.from('order_items').insert(
    items.map((i: any) => ({
      order_id: order.id,
      product_id: i.product_id,
      product_name: i.name,
      product_price: i.price,
      quantity: i.quantity,
      size: i.size
    }))
  );

  // Safely wipes the cart data on the server
  await supabaseAdmin.from('cart_items').delete().eq('session_id', sessionId);

  return NextResponse.json({
    success: true,
    orderNumber: order.order_number,
    total,
    email,
    shippingCost: shippingCost || 0,
    createdAt: new Date().toISOString(),
    items: itemsForOrder,
  });
}
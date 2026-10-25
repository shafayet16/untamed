'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MobileMenu from '../MobileMenu';

export default function OrderConfirmationPage() {
  const [scrolled, setScrolled] = useState(false);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    const lastOrderRaw = localStorage.getItem('lastOrder');
    if (lastOrderRaw) {
      try {
        const parsed = JSON.parse(lastOrderRaw);
        setOrder(parsed);
        localStorage.removeItem('lastOrder');

        // Fire Purchase event
        if (typeof window !== 'undefined' && (window as any).fbq) {
          (window as any).fbq('track', 'Purchase', {
            value: Number(parsed.total),
            currency: 'BDT',
            content_ids: parsed.items?.map((i: any) => String(i.id)) || [],
            content_type: 'product',
            num_items: parsed.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 1,
          });
        }
      } catch (e) {
        console.error('Could not parse last order', e);
      }
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-[#f4f4f5] overflow-x-hidden">
      
      {/* HEADER */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ease-out ${
          scrolled
            ? 'bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]'
            : 'bg-[#0a0a0a]/80 backdrop-blur-sm border-b border-[#52525b]/20'
        }`}
      >
        <div className="px-4 py-2 md:py-3 md:px-8">
          <div className="flex items-center justify-between md:hidden">
            <div className="w-8">
              <MobileMenu />
            </div>
            <div>
              <Link href="/">
                <img src="/untamedlogo.png" alt="UNTAMED" className="h-6 w-auto object-contain mix-blend-screen" />
              </Link>
            </div>
            <div className="flex items-center gap-3 w-8 justify-end">
              <Link
                href="/cart"
                className="text-[#d4d4d8] hover:text-[#f4f4f5] transition-all duration-300 hover:scale-110 active:scale-90"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-6">
              <MobileMenu />
            </div>
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <Link href="/">
                <img src="/untamedlogo.png" alt="UNTAMED" className="h-8 w-auto object-contain mix-blend-screen" />
              </Link>
            </div>
            <div className="flex items-center gap-5">
              <Link
                href="/cart"
                className="relative text-[#d4d4d8] hover:text-[#f4f4f5] transition-all duration-300 hover:scale-110 active:scale-90"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="h-14 md:h-16"></div>

      {/* CONFIRMATION CONTENT */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-600/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-4">ORDER CONFIRMED</h1>
          <p className="text-[#a1a1aa] mb-8">Thank you for your purchase. Your order has been received and is being processed.</p>
          
          {order && (
            <div className="bg-[#18181b] border border-[#52525b]/20 p-6 mb-8 text-left">
              <p className="text-xs text-[#a1a1aa] mb-2">ORDER NUMBER</p>
              <p className="text-sm font-mono mb-4">{order.orderNumber}</p>
              <p className="text-xs text-[#a1a1aa] mb-2">ORDER DATE</p>
              <p className="text-sm mb-4">{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Just now'}</p>
              <p className="text-xs text-[#a1a1aa] mb-2">TOTAL AMOUNT</p>
              <p className="text-lg font-bold">৳{Number(order.total).toLocaleString()}</p>
              <p className="text-xs text-[#a1a1aa] mt-4 pt-4 border-t border-[#52525b]/20">{order.email}</p>
              
              {order.items && order.items.length > 0 && (
                <div className="mt-6 pt-4 border-t border-[#52525b]/20">
                  <p className="text-xs text-[#a1a1aa] mb-4">ITEMS ORDERED</p>
                  <div className="space-y-3">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.name} x{item.quantity} ({item.size})</span>
                        <span>৳{(Number(item.price) * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-4">
            <Link href="/shop" className="inline-block w-full md:w-auto px-8 py-3 bg-white text-black font-bold uppercase tracking-wider text-sm hover:bg-[#d4d4d8] transition">CONTINUE SHOPPING</Link>
            <div><Link href="/" className="text-xs text-[#a1a1aa] hover:text-white transition uppercase tracking-wider">RETURN TO HOMEPAGE</Link></div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="pt-12 pb-14 text-center border-t border-[#52525b]/20">
        <div className="text-[10px] tracking-[0.25em] text-[#52525b] uppercase">© 2026 UNTAMED. All rights reserved.</div>
        <div className="text-[9px] font-mono lowercase tracking-normal text-[#52525b]/70 mt-2">made by shafbitz</div>
      </footer>
    </div>
  );
}

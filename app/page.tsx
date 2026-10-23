'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import MobileMenu from './MobileMenu';

// Supabase configuration driven by your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const R2_PUBLIC_URL = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/$/, '');

type Product = {
  id: string;
  name: string;
  price: number | null;
  category: string;
  image: string;
  images?: string[];
  is_bestseller: boolean;
  in_stock: boolean;
};

// Cloudflare R2 URL normalizer
const getProductImageUrl = (product: Product): string => {
  const rawImage = product.image || (product.images && product.images[0]);
  if (!rawImage) return '';

  // If already a full URL
  if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
    return rawImage;
  }

  // Handle paths
  let cleanPath = rawImage.replace(/^\/+/, '');
  if (cleanPath.startsWith('product-images/')) {
    cleanPath = cleanPath.replace('product-images/', '');
  }

  if (cleanPath.startsWith('products/')) {
    return `${R2_PUBLIC_URL}/${cleanPath}`;
  }

  return `${R2_PUBLIC_URL}/products/${cleanPath}`;
};

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [newDrops, setNewDrops] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch newest products directly from your Supabase database
  useEffect(() => {
    const fetchNewDrops = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

      if (!error && data) {
        setNewDrops(data);
      } else {
        console.error('Error fetching new drops:', error);
      }
      setLoading(false);
    };

    fetchNewDrops();
  }, []);

  return (
    <div className="min-h-[100dvh] w-full bg-[#0a0a0a] text-[#f4f4f5] font-sans antialiased selection:bg-[#d4d4d8] selection:text-[#0a0a0a] overflow-x-hidden">
      
      {/* INJECTED CSS FOR ANIMATIONS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes infinite-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: infinite-scroll 20s linear infinite;
          will-change: transform;
        }
        .animate-marquee:hover, 
        .animate-marquee:active {
          animation-play-state: paused;
        }
        
        @keyframes subtle-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }

        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        .hero-fade-in {
          animation: fadeIn 1.2s ease-out forwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .fade-in-up {
          animation: fadeInUp 0.8s ease-out 0.3s forwards;
          opacity: 0;
        }

        @keyframes shimmer {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
            border-bottom-color: rgba(255, 255, 255, 0.1);
          }
          50% {
            box-shadow: 0 2px 20px 0 rgba(255, 255, 255, 0.15);
            border-bottom-color: rgba(255, 255, 255, 0.3);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
            border-bottom-color: rgba(255, 255, 255, 0.1);
          }
        }
        .navbar-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }

        /* Seamless edge gradient mask for wide hero display without cropping center graphic */
        .hero-edge-blend {
          background: #0a0a0a;
          mask-image: linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 25%, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 100%);
          -webkit-mask-image: linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 25%, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 100%);
        }
      `}} />

      {/* 1. HEADER */}
      <header className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ease-out ${
        scrolled 
          ? 'bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)] navbar-shimmer' 
          : 'bg-[#0a0a0a]/80 backdrop-blur-sm border-b border-[#52525b]/20'
      }`}>
        <div className="px-4 py-2 md:py-3 md:px-8">
          {/* Mobile Layout */}
          <div className="flex items-center justify-between md:hidden">
            <div className="w-8">
              <MobileMenu />
            </div>
            {/* Cart icon */}
            <div className="flex items-center gap-3 w-8 justify-end">
              <Link href="/cart" className="relative text-[#d4d4d8] hover:text-[#f4f4f5] transition-all duration-300 hover:scale-110 active:scale-90">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6" />
                </svg>
                <span className="absolute -top-2 -right-2 bg-[#f4f4f5] text-[#0a0a0a] text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">0</span>
              </Link>
            </div>
          </div>
          
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-6">
              <MobileMenu />
            </div>
            <div className="flex items-center gap-5">
              <Link href="/cart" className="relative text-[#d4d4d8] hover:text-[#f4f4f5] transition-all duration-300 hover:scale-110 active:scale-90">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6" />
                </svg>
                <span className="absolute -top-2 -right-2 bg-[#f4f4f5] text-[#0a0a0a] text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">0</span>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <div className="h-14 md:h-16"></div>

      {/* 2. HERO */}
      <section className="relative w-full h-[65dvh] md:h-[80dvh] border-b border-[#52525b]/25 overflow-hidden bg-[#0a0a0a] flex items-center justify-center">
        {/* Expanded background blur clone to fill width seamlessly */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30 filter blur-2xl pointer-events-none scale-125">
          <img src="/tuff.jpg" alt="" className="w-full h-full object-cover" />
        </div>

        {/* Main uncropped image centered with smooth edge gradient fade */}
        <div className="relative h-full w-full max-w-5xl flex items-center justify-center hero-edge-blend">
          <img 
            src="/tuff.jpg" 
            alt="Hero Collection" 
            className="h-full w-auto object-contain hero-fade-in"
          />
        </div>
        
        {/* Shop Button */}
        <div className="absolute z-20 text-center px-4 bottom-12 md:bottom-16 left-1/2 transform -translate-x-1/2">
          <Link href="/shop" className="fade-in-up inline-block bg-transparent text-white border border-white hover:bg-white hover:text-black active:bg-[#d4d4d8] active:text-black active:scale-95 uppercase tracking-[0.25em] text-xs md:text-sm font-bold px-8 py-3 md:px-12 md:py-4 transition-all duration-300 hover:scale-105 shadow-2xl">
            shop
          </Link>
        </div>
      </section>

      {/* 3. SHOP BY CATEGORY */}
      <section className="w-full bg-[#0a0a0a] py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-sm md:text-base font-black tracking-[0.3em] uppercase text-center text-[#f4f4f5] mb-12 md:mb-16">
            SHOP BY CATEGORY
          </h2>
          
          <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-2xl mx-auto">
            <Link href="/shop?category=gray-pants" className="group cursor-pointer">
              <div className="relative aspect-[3/4] overflow-hidden bg-[#18181b] border border-white/10 flex items-center justify-center">
                <img 
                  src="/graypant.png" 
                  alt="Gray Pants" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
            </Link>

            <Link href="/shop?category=black-pants" className="group cursor-pointer">
              <div className="relative aspect-[3/4] overflow-hidden bg-[#18181b] border border-white/10 flex items-center justify-center">
                <img 
                  src="/blackpant.png" 
                  alt="Black Pants" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. NEW DROPS HEADER */}
      <section className="w-full bg-[#0a0a0a] text-center py-10 md:py-14">
        <h2 className="text-sm md:text-base font-black tracking-[0.3em] uppercase text-[#f4f4f5]">
          NEW DROPS
        </h2>
      </section>

      {/* 5. DYNAMIC NEW DROPS GRID */}
      <section className="w-full bg-[#0a0a0a] pb-12 md:pb-16 border-b border-[#52525b]/20 overflow-hidden">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            </div>
          ) : newDrops.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/10 max-w-xl mx-auto rounded-lg">
              <p className="text-xs text-[#a1a1aa] uppercase font-mono tracking-widest">No products available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {newDrops.map((product) => {
                const imageUrl = getProductImageUrl(product);
                return (
                  <Link key={product.id} href={`/product/${product.id}`} className="group cursor-pointer block">
                    <div className="relative aspect-[3/4] overflow-hidden bg-[#18181b] border border-white/5">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs font-mono">NO IMAGE</div>
                      )}
                    </div>
                    <div className="mt-4 text-center">
                      <h3 className="text-xs md:text-sm font-medium uppercase tracking-wide text-[#f4f4f5] group-hover:text-[#a1a1aa] transition-colors truncate px-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-[#a1a1aa] mt-1">
                        ৳{product.price !== null && product.price !== undefined ? product.price.toLocaleString() : '0'}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full bg-[#0a0a0a] pt-16 pb-14 text-center flex flex-col items-center relative border-t border-[#52525b]/20">
        <div className="flex flex-col items-center gap-4 mb-10 text-[10px] md:text-sm tracking-[0.15em] text-[#d4d4d8]/90 font-light uppercase">
          <p className="transition-colors duration-300 hover:text-white">Designed In Dhaka</p>
          <p className="transition-colors duration-300 hover:text-white">Delivery Within 2-4 days</p>
          <p className="transition-colors duration-300 hover:text-white">Delivery all over bangladesh</p>
        </div>
        <div className="w-[90%] max-w-5xl h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mb-10" />
        
        {/* CENTERED INSTAGRAM ICON */}
        <div className="flex justify-center mb-8">
          <a 
            href="https://instagram.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-12 h-12 flex items-center justify-center text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#52525b]/20 rounded-full transition-all duration-300 hover:-translate-y-1 active:scale-95" 
            aria-label="Instagram"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0 3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </a>
        </div>

        <div className="leading-relaxed text-[10px] md:text-xs tracking-[0.25em] text-[#52525b] uppercase space-y-2">
          <p className="font-bold text-[#71717a] transition-all duration-300 hover:text-[#a1a1aa] active:text-white">© 2026 UNTAMED. All rights reserved.</p>
          <p className="text-[9px] font-mono lowercase tracking-normal text-[#52525b]/70 transition-all duration-300 hover:text-[#71717a] active:text-white">made by shafbitz</p>
        </div>
      </footer>
    </div>
  );
}
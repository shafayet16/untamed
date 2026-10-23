'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      {/* Hamburger Button - transforms to X when open */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-6 h-6 flex flex-col justify-center items-center group z-50"
        aria-label="Menu"
      >
        <span className={`absolute h-[2px] w-6 bg-[#f4f4f5] transition-all duration-300 ease-out ${isOpen ? 'rotate-45' : '-translate-y-2'}`} />
        <span className={`absolute h-[2px] w-6 bg-[#f4f4f5] transition-all duration-300 ease-out ${isOpen ? '-rotate-45' : 'translate-y-2'}`} />
      </button>

      {/* Dropdown Menu - slides down from header */}
      <div 
        ref={menuRef}
        className={`absolute top-full left-0 right-0 bg-[#0a0a0a] border-b border-[#52525b]/20 transition-all duration-400 ease-out z-40 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="container mx-auto px-6 py-8 md:py-12">
          <div className="grid grid-cols-2 gap-8 md:gap-12 max-w-2xl mx-auto">
            {/* Left Column - Shop */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#52525b] mb-4">Shop</h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/shop" 
                    onClick={() => setIsOpen(false)} 
                    className="text-sm md:text-base uppercase text-[#d4d4d8] hover:text-[#f4f4f5] transition duration-200"
                  >
                    All
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/shop?category=tops" 
                    onClick={() => setIsOpen(false)} 
                    className="text-sm md:text-base uppercase text-[#d4d4d8] hover:text-[#f4f4f5] transition duration-200"
                  >
                    Tops
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/shop?category=pants" 
                    onClick={() => setIsOpen(false)} 
                    className="text-sm md:text-base uppercase text-[#d4d4d8] hover:text-[#f4f4f5] transition duration-200"
                  >
                    Pants
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Right Column - Discover */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#52525b] mb-4">Discover</h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/cart" 
                    onClick={() => setIsOpen(false)} 
                    className="text-sm md:text-base uppercase text-[#d4d4d8] hover:text-[#f4f4f5] transition duration-200"
                  >
                    Cart
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/" 
                    onClick={() => setIsOpen(false)} 
                    className="text-sm md:text-base uppercase text-[#d4d4d8] hover:text-[#f4f4f5] transition duration-200"
                  >
                    Homepage
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
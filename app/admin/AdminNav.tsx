'use client';

import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://thkbnqmnatphefnnllme.supabase.co',
  'sb_publishable_4U7gn3gCQ3np5-Y9cD-sTQ_b0EWrYdC'
);

export default function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const linkClass = (href: string) =>
    `text-xs uppercase tracking-wider px-3 py-2 transition ${
      pathname === href
        ? 'text-white border-b border-white'
        : 'text-neutral-400 hover:text-white'
    }`;

  return (
    <div className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-white mr-4">
            UNTAMED ADMIN
          </span>
          <button onClick={() => router.push('/admin/dashboard')} className={linkClass('/admin/dashboard')}>
            Orders
          </button>
          <button onClick={() => router.push('/admin/products')} className={linkClass('/admin/products')}>
            Products
          </button>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-neutral-400 hover:text-white uppercase tracking-wider"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
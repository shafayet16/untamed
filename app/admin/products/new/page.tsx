'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Dynamically pull from your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AddProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('tops');
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [inStock, setInStock] = useState(true);
  const [isBestseller, setIsBestseller] = useState(false);
  
  const [images, setImages] = useState<string[]>(['', '', '', '', '']);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingIndex(index);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate upload link.');

      const uploadRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error('Direct upload to Cloudflare R2 failed.');

      const updated = [...images];
      updated[index] = data.publicUrl;
      setImages(updated);
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const finalImagesArray = images.filter((url) => url.trim() !== '');

    if (!name || !price) {
      setError('Name and Price are required.');
      setLoading(false);
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('products')
        .insert([
          {
            name,
            price: parseFloat(price) || 0,
            category,
            description,
            details,
            in_stock: inStock,
            is_bestseller: isBestseller,
            images: finalImagesArray,
            image: finalImagesArray[0] || '/feralshirt1.png',
            sizes: ['S', 'M', 'L', 'XL']
          }
        ]);

      if (insertError) throw insertError;

      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      console.error('Error inserting product:', err);
      setError(err.message || 'Failed creating new product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f4f4f5] font-sans antialiased pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto bg-[#0a0a0a] border border-[#27272a] p-6 md:p-8">
        
        <div className="flex items-center justify-between mb-8 border-b border-[#27272a] pb-4">
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider">ADD NEW PRODUCT</h1>
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="text-xs uppercase tracking-widest text-[#a1a1aa] hover:text-white transition-colors font-mono"
          >
            [ CANCEL ]
          </button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-200 text-xs uppercase tracking-wider px-4 py-3 mb-6 font-mono">
            Error: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-widest text-[#71717a] font-bold">Product Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Brazil Embroidered Jersey"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#111] border border-[#27272a] px-4 py-3 text-sm text-[#f4f4f5] focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest text-[#71717a] font-bold">Price (BDT)</label>
              <input
                type="number"
                required
                placeholder="1599"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-[#111] border border-[#27272a] px-4 py-3 text-sm text-[#f4f4f5] focus:outline-none focus:border-white transition-colors font-mono"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest text-[#71717a] font-bold">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#111] border border-[#27272a] px-4 py-3 text-sm text-[#f4f4f5] focus:outline-none focus:border-white transition-colors appearance-none cursor-pointer"
              >
                <option value="tops">Tops</option>
                <option value="pants">Pants</option>
                <option value="jackets">Jackets</option>
                <option value="denims">Denims</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <label className="text-xs uppercase tracking-widest text-[#71717a] font-bold block">
              Product Gallery Images (Up to 5 slots)
            </label>
            
            <div className="grid grid-cols-1 gap-3">
              {images.map((url, index) => (
                <div key={index} className="flex flex-col gap-2 p-3 bg-[#111] border border-white/5">
                  <span className="text-[10px] text-[#71717a] font-mono uppercase flex justify-between">
                    <span>Image URL Slot {index + 1}</span>
                    {uploadingIndex === index && <span className="text-white animate-pulse">UPLOADING TO R2...</span>}
                  </span>
                  <div className="flex gap-2 items-center">
                    <label className="bg-[#0a0a0a] border border-[#27272a] px-3 py-2 text-[10px] uppercase cursor-pointer hover:border-white transition-colors text-[#71717a] hover:text-white font-mono shrink-0">
                      BROWSE
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, index)} />
                    </label>
                    <input
                      type="text"
                      placeholder="Paste URL or browse..."
                      value={url}
                      onChange={(e) => {
                        const updated = [...images];
                        updated[index] = e.target.value;
                        setImages(updated);
                      }}
                      className="flex-1 bg-[#0a0a0a] border border-[#27272a] px-3 py-2 text-xs text-[#f4f4f5] focus:outline-none focus:border-white transition-colors font-mono"
                    />
                    {url.trim() !== '' && (
                      <img 
                        src={url} 
                        alt="Preview" 
                        className="w-9 h-9 object-cover bg-[#0a0a0a] border border-white/10 shrink-0"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-widest text-[#71717a] font-bold">Description</label>
            <textarea
              rows={3}
              placeholder="Enter description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#111] border border-[#27272a] px-4 py-3 text-sm text-[#f4f4f5] focus:outline-none focus:border-white transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-widest text-[#71717a] font-bold">Details</label>
            <textarea
              rows={2}
              placeholder="e.g., Fabric specs..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full bg-[#111] border border-[#27272a] px-4 py-3 text-sm text-[#f4f4f5] focus:outline-none focus:border-white transition-colors resize-none font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 bg-[#111] p-4 border border-[#27272a]">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="w-4 h-4 accent-white" />
              <span className="text-xs uppercase text-[#a1a1aa]">In Stock</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isBestseller} onChange={(e) => setIsBestseller(e.target.checked)} className="w-4 h-4 accent-white" />
              <span className="text-xs uppercase text-[#a1a1aa]">Bestseller</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black hover:bg-[#d4d4d8] disabled:bg-[#27272a] font-bold uppercase tracking-[0.2em] text-xs py-4 transition-all"
          >
            {loading ? 'PUBLISHING...' : 'PUBLISH PRODUCT TO STORE'}
          </button>
        </form>
      </div>
    </div>
  );
}
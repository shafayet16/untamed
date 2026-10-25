'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Dynamically pull from your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Robust error message extractor
const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    if ('message' in err && typeof err.message === 'string') return err.message;
    if ('error' in err && typeof err.error === 'string') return err.error;
    if ('details' in err && typeof err.details === 'string') return err.details;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return 'An unknown error occurred';
};

function EditProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Form Field State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [inStock, setInStock] = useState(true);
  const [isBestseller, setIsBestseller] = useState(false);
  
  const [images, setImages] = useState<string[]>(['', '', '', '', '']);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Size stock state
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({
    M: 0,
    L: 0,
    XL: 0,
    XXL: 0,
  });
  const [stockCount, setStockCount] = useState<number>(0);

  const assignProductData = (data: any) => {
    if (!data) return;
    setName(data.name || '');
    setPrice(data.price ? data.price.toString() : '');
    
    // read categories array, fallback to single category
    if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
      setCategories(data.categories);
    } else if (data.category) {
      setCategories([data.category]);
    } else {
      setCategories([]);
    }

    setDescription(data.description || '');
    setDetails(data.details || '');
    setInStock(data.in_stock ?? true);
    setIsBestseller(data.is_bestseller ?? false);

    let loadedImages: string[] = ['', '', '', '', ''];
    if (data.images && Array.isArray(data.images)) {
      data.images.forEach((imgUrl: string, i: number) => {
        if (i < 5) loadedImages[i] = imgUrl || '';
      });
    } else if (data.image) {
      loadedImages[0] = data.image;
    }
    setImages(loadedImages);

    const sq = data.size_quantities
      ? (typeof data.size_quantities === 'string'
          ? JSON.parse(data.size_quantities)
          : data.size_quantities)
      : {};
    setSizeQuantities({
      M: sq.M ?? 0,
      L: sq.L ?? 0,
      XL: sq.XL ?? 0,
      XXL: sq.XXL ?? 0,
    });
    setStockCount(data.stock_count ?? 0);
  };

  useEffect(() => {
    if (!productId) {
      setError('No product ID provided in the URL.');
      setFetching(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        const numericId = Number(productId);
        if (isNaN(numericId)) {
          setError(`The ID "${productId}" is not a valid number.`);
          setFetching(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .eq('id', numericId)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (data) {
          assignProductData(data);
        } else {
          setError(`Product ID ${productId} does not exist in your database.`);
        }
      } catch (err: any) {
        setError(getErrorMessage(err));
      } finally {
        setFetching(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingIndex(index);

    try {
      // 1. Get presigned upload URL from Cloudflare R2 endpoint
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

      // 2. Upload file directly to Cloudflare R2 bucket
      const uploadRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error('Direct upload to Cloudflare R2 failed.');

      // 3. Update state with R2 public CDN URL
      setImages((prevImages) => {
        const nextImages = [...prevImages];
        nextImages[index] = data.publicUrl;
        return nextImages;
      });
    } catch (err: any) {
      alert('Upload failed: ' + getErrorMessage(err));
    } finally {
      setUploadingIndex(null);
      if (fileInputRefs.current[index]) fileInputRefs.current[index]!.value = '';
    }
  };

  const handleUrlTextChange = (value: string, index: number) => {
    setImages((prevImages) => {
      const nextImages = [...prevImages];
      nextImages[index] = value;
      return nextImages;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;
    setLoading(true);
    setError(null);

    const finalImagesArray = images.filter((url) => url && url.trim() !== '');

    const updateData = {
      name,
      price: parseFloat(price) || 0,
      categories: categories,                 
      category: categories[0] || '',          
      description,
      details,
      in_stock: inStock,
      is_bestseller: isBestseller,
      images: finalImagesArray,
      image: finalImagesArray[0] || '/feralshirt1.png',
      size_quantities: sizeQuantities,
      stock_count: stockCount,
    };

    try {
      const numericId = Number(productId);
      if (isNaN(numericId)) {
        setError('Invalid product ID.');
        setLoading(false);
        return;
      }

      const { data, error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', numericId)
        .select();

      if (updateError) throw updateError;

      if (!data || data.length === 0) {
        setError('Update rejected. Check RLS policies.');
        setLoading(false);
        return;
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = ['tops', 'pants', 'jackets', 'denims'];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f4f4f5] font-sans antialiased pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto bg-[#0a0a0a] border border-[#27272a] p-6 md:p-8">
        <div className="flex items-center justify-between mb-8 border-b border-[#27272a] pb-4">
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider">EDIT PRODUCT</h1>
          <button type="button" onClick={() => router.back()} className="text-xs uppercase tracking-widest text-[#a1a1aa] hover:text-white transition-colors font-mono">[ BACK ]</button>
        </div>

        {error && <div className="bg-red-900/20 border border-red-500 text-red-200 text-xs px-4 py-3 mb-6 font-mono">Status Notice: {error}</div>}

        {fetching && !error ? (
          <div className="text-xs text-[#a1a1aa] font-mono animate-pulse py-8 text-center">SYNCHRONIZING WITH TABLE RECORD...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest text-[#71717a] font-bold">Product Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#111] border border-[#27272a] px-4 py-3 text-sm text-[#f4f4f5] focus:outline-none focus:border-white transition-colors" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest text-[#71717a] font-bold">Price (BDT)</label>
                <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-[#111] border border-[#27272a] px-4 py-3 text-sm text-[#f4f4f5] focus:outline-none focus:border-white transition-colors font-mono" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest text-[#71717a] font-bold">Categories (select all that apply)</label>
                <div className="flex flex-wrap gap-4 bg-[#111] border border-[#27272a] p-3">
                  {categoryOptions.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={categories.includes(cat)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCategories([...categories, cat]);
                          } else {
                            setCategories(categories.filter(c => c !== cat));
                          }
                        }}
                        className="w-4 h-4 accent-white bg-black border border-white/20"
                      />
                      <span className="text-xs uppercase tracking-wider text-[#a1a1aa] hover:text-white transition-colors">
                        {cat}
                      </span>
                    </label>
                  ))}
                </div>
                {categories.length === 0 && (
                  <p className="text-[10px] text-red-400 font-mono">At least one category must be selected.</p>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <label className="text-xs uppercase tracking-widest text-[#71717a] font-bold block">Product Images Gallery (Up to 5 slots)</label>
              <div className="grid grid-cols-1 gap-3">
                {images.map((url, index) => (
                  <div key={`image-slot-${index}`} className="p-3 bg-[#111] border border-white/5 flex gap-4 items-start">
                    
                    <div className="relative w-16 h-16 bg-[#0a0a0a] border border-[#27272a] shrink-0 flex items-center justify-center overflow-hidden group">
                      {url && url.trim() !== '' ? (
                        <>
                          <img 
                            src={url} 
                            alt={`Slot ${index + 1}`} 
                            className="w-full h-full object-cover" 
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} 
                          />
                          <button
                            type="button"
                            onClick={() => handleUrlTextChange('', index)}
                            className="absolute inset-0 bg-red-900/80 text-white text-[9px] font-mono tracking-wider opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity uppercase"
                            title="Clear slot"
                          >
                            [ REMOVE ]
                          </button>
                        </>
                      ) : (
                        <span className="text-[9px] text-[#444] font-mono tracking-tighter uppercase text-center px-1">EMPTY {index + 1}</span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col gap-2 h-full justify-center">
                      <span className="text-[10px] text-[#71717a] font-mono uppercase flex justify-between">
                        <span>Image asset slot {index + 1}</span>
                        {uploadingIndex === index && <span className="text-white animate-pulse font-bold">UPLOADING TO R2...</span>}
                      </span>
                      <div className="flex gap-2 items-center">
                        <label className="bg-[#0a0a0a] border border-[#27272a] px-3 py-2 text-[10px] uppercase cursor-pointer hover:border-white transition-colors text-[#71717a] hover:text-white font-mono shrink-0">
                          BROWSE
                          <input type="file" accept="image/*" ref={(el) => { fileInputRefs.current[index] = el; }} className="hidden" onChange={(e) => handleFileUpload(e, index)} />
                        </label>
                        <input 
                          type="text" 
                          placeholder="Paste asset location URL..." 
                          value={url} 
                          onChange={(e) => handleUrlTextChange(e.target.value, index)} 
                          className="flex-1 bg-[#0a0a0a] border border-[#27272a] px-3 py-2 text-xs text-[#f4f4f5] focus:outline-none focus:border-white transition-colors font-mono" 
                        />
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest text-[#71717a] font-bold">Description (Includes Size Matrix)</label>
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-[#111] border border-[#27272a] px-4 py-3 text-sm text-[#f4f4f5] focus:outline-none focus:border-white transition-colors resize-y font-mono" placeholder="Product details text and size dimensions go here..." />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest text-[#71717a] font-bold">Product Details Specifications</label>
              <textarea rows={4} value={details} onChange={(e) => setDetails(e.target.value)} className="w-full bg-[#111] border border-[#27272a] px-4 py-3 text-sm text-[#f4f4f5] focus:outline-none focus:border-white transition-colors resize-y font-mono" placeholder="Composition, care instructions, technical specs..." />
            </div>

            <div className="grid grid-cols-2 gap-4 bg-[#111] p-4 border border-[#27272a]">
              <label className="flex items-center gap-3 cursor-pointer group select-none">
                <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="w-4 h-4 accent-white bg-black border border-white/20" />
                <span className="text-xs uppercase tracking-wider text-[#a1a1aa] group-hover:text-white transition-colors">In Stock</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group select-none">
                <input type="checkbox" checked={isBestseller} onChange={(e) => setIsBestseller(e.target.checked)} className="w-4 h-4 accent-white bg-black border border-white/20" />
                <span className="text-xs uppercase tracking-wider text-[#a1a1aa] group-hover:text-white transition-colors">Bestseller</span>
              </label>
            </div>

            {/* SIZE STOCK MANAGEMENT */}
            <div className="space-y-3 bg-[#111] p-4 border border-[#27272a]">
              <h3 className="text-xs uppercase tracking-widest text-[#71717a] font-bold">
                Per‑Size Stock Quantities
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(sizeQuantities).map(([size, qty]) => (
                  <div key={size} className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#a1a1aa]">
                      {size}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={qty}
                      onChange={(e) =>
                        setSizeQuantities((prev) => ({
                          ...prev,
                          [size]: Math.max(0, parseInt(e.target.value) || 0),
                        }))
                      }
                      className="w-full bg-[#0a0a0a] border border-[#27272a] px-3 py-2 text-sm text-white focus:outline-none focus:border-white transition-colors font-mono"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider text-[#a1a1aa]">
                    Total Stock Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockCount}
                    onChange={(e) => setStockCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#0a0a0a] border border-[#27272a] px-3 py-2 text-sm text-white focus:outline-none focus:border-white transition-colors font-mono"
                  />
                </div>
              </div>
              <p className="text-[10px] text-[#71717a] font-mono">
                Set zero for out‑of‑stock sizes. In‑stock status above will still override availability if unchecked.
              </p>
            </div>

            <button type="submit" disabled={loading || categories.length === 0} className="w-full bg-white text-black hover:bg-[#d4d4d8] disabled:bg-[#27272a] disabled:text-[#71717a] font-bold uppercase tracking-[0.2em] text-xs py-4 transition-all duration-300">
              {loading ? 'PUSHING DATABASE UPDATE...' : 'SAVE PRODUCT CHANGES'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function EditProduct() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center font-mono">LOADING CONTEXT...</div>}>
      <EditProductForm />
    </Suspense>
  );
}
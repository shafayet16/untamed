'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MobileMenu from '../MobileMenu';
import { useCartStore } from '@/app/store/cartStore';

const R2_PUBLIC_URL = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://pub-fab4e79b5407486695278c53c8ded542.r2.dev'
).replace(/\/$/, '');

// Normalizes any image input (array, legacy Supabase URL, or filename) into a valid R2 public URL
const formatImageUrl = (item: any): string => {
  const rawUrl = 
    item?.image ?? 
    (item?.products?.images && Array.isArray(item.products.images) && item.products.images.length > 0 && item.products.images[0]) ?? 
    item?.products?.image;
  
  if (!rawUrl || typeof rawUrl !== 'string') return '/feralshirt1.png';
  
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    if (rawUrl.includes('/storage/v1/object/public/product-images/')) {
      const filename = rawUrl.split('/product-images/')[1];
      return `${R2_PUBLIC_URL}/products/${filename}`;
    }
    return rawUrl;
  }

  const cleanPath = rawUrl.replace(/^\//, '');
  if (cleanPath.startsWith('products/')) {
    return `${R2_PUBLIC_URL}/${cleanPath}`;
  }
  return `${R2_PUBLIC_URL}/products/${cleanPath}`;
};

const BD_DISTRICTS = [
  // Dhaka Division (13 districts)
  { district: 'Dhaka', division: 'Dhaka' },
  { district: 'Gazipur', division: 'Dhaka' },
  { district: 'Narayanganj', division: 'Dhaka' },
  { district: 'Narsingdi', division: 'Dhaka' },
  { district: 'Tangail', division: 'Dhaka' },
  { district: 'Kishoreganj', division: 'Dhaka' },
  { district: 'Manikganj', division: 'Dhaka' },
  { district: 'Munshiganj', division: 'Dhaka' },
  { district: 'Rajbari', division: 'Dhaka' },
  { district: 'Faridpur', division: 'Dhaka' },
  { district: 'Gopalganj', division: 'Dhaka' },
  { district: 'Madaripur', division: 'Dhaka' },
  { district: 'Shariatpur', division: 'Dhaka' },

  // Chattogram Division (11 districts)
  { district: 'Chattogram', division: 'Chattogram' },
  { district: "Cox's Bazar", division: 'Chattogram' },
  { district: 'Feni', division: 'Chattogram' },
  { district: 'Cumilla', division: 'Chattogram' },
  { district: 'Brahmanbaria', division: 'Chattogram' },
  { district: 'Noakhali', division: 'Chattogram' },
  { district: 'Lakshmipur', division: 'Chattogram' },
  { district: 'Chandpur', division: 'Chattogram' },
  { district: 'Rangamati', division: 'Chattogram' },
  { district: 'Khagrachhari', division: 'Chattogram' },
  { district: 'Bandarban', division: 'Chattogram' },

  // Rajshahi Division (8 districts)
  { district: 'Rajshahi', division: 'Rajshahi' },
  { district: 'Bogura', division: 'Rajshahi' },
  { district: 'Pabna', division: 'Rajshahi' },
  { district: 'Natore', division: 'Rajshahi' },
  { district: 'Sirajganj', division: 'Rajshahi' },
  { district: 'Naogaon', division: 'Rajshahi' },
  { district: 'Joypurhat', division: 'Rajshahi' },
  { district: 'Chapainawabganj', division: 'Rajshahi' },

  // Khulna Division (10 districts)
  { district: 'Khulna', division: 'Khulna' },
  { district: 'Jashore', division: 'Khulna' },
  { district: 'Satkhira', division: 'Khulna' },
  { district: 'Bagerhat', division: 'Khulna' },
  { district: 'Kushtia', division: 'Khulna' },
  { district: 'Jhenaidah', division: 'Khulna' },
  { district: 'Chuadanga', division: 'Khulna' },
  { district: 'Meherpur', division: 'Khulna' },
  { district: 'Magura', division: 'Khulna' },
  { district: 'Narail', division: 'Khulna' },

  // Sylhet Division (4 districts)
  { district: 'Sylhet', division: 'Sylhet' },
  { district: 'Moulvibazar', division: 'Sylhet' },
  { district: 'Habiganj', division: 'Sylhet' },
  { district: 'Sunamganj', division: 'Sylhet' },

  // Rangpur Division (8 districts)
  { district: 'Rangpur', division: 'Rangpur' },
  { district: 'Dinajpur', division: 'Rangpur' },
  { district: 'Nilphamari', division: 'Rangpur' },
  { district: 'Kurigram', division: 'Rangpur' },
  { district: 'Gaibandha', division: 'Rangpur' },
  { district: 'Lalmonirhat', division: 'Rangpur' },
  { district: 'Thakurgaon', division: 'Rangpur' },
  { district: 'Panchagarh', division: 'Rangpur' },

  // Barisal Division (6 districts)
  { district: 'Barisal', division: 'Barisal' },
  { district: 'Bhola', division: 'Barisal' },
  { district: 'Patuakhali', division: 'Barisal' },
  { district: 'Pirojpur', division: 'Barisal' },
  { district: 'Barguna', division: 'Barisal' },
  { district: 'Jhalokathi', division: 'Barisal' },

  // Mymensingh Division (4 districts)
  { district: 'Mymensingh', division: 'Mymensingh' },
  { district: 'Jamalpur', division: 'Mymensingh' },
  { district: 'Netrokona', division: 'Mymensingh' },
  { district: 'Sherpur', division: 'Mymensingh' }
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items: cartItems, fetchCart } = useCartStore();

  const [scrolled, setScrolled] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [isBuyNow, setIsBuyNow] = useState(false);
  const [hasCheckedData, setHasCheckedData] = useState(false);

  // Autocomplete functional states
  const [citySuggestions, setCitySuggestions] = useState<{ district: string; division: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    postalCode: '',
    address: '',
    paymentMethod: 'cod',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    const loadData = async () => {
      await fetchCart();
      setHasCheckedData(true);
    };

    loadData();

    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const singleItemRaw = localStorage.getItem('checkoutItem');

    if (cartItems && cartItems.length > 0) {
      setCheckoutItems(cartItems);
      setIsBuyNow(false);
      localStorage.removeItem('checkoutItem');
    } else if (singleItemRaw) {
      try {
        const parsed = JSON.parse(singleItemRaw);
        setCheckoutItems([{ ...parsed, product_id: parsed.id }]);
        setIsBuyNow(true);
      } catch (e) {
        console.error("Error parsing buy now payload:", e);
      }
    } else if (hasCheckedData && cartItems.length === 0) {
      router.push('/shop');
    }
  }, [cartItems, hasCheckedData]);

  const subtotal = checkoutItems.reduce((acc, item) => {
    const rawPrice = item.price ?? item.products?.price ?? 0;
    const cleanPrice = Number(rawPrice);
    const qty = item.quantity || 1;
    return acc + (cleanPrice * qty);
  }, 0);

  const shippingCost = formData.city ? (formData.city === 'Dhaka' ? 80 : 130) : null;
  const orderTotal = shippingCost !== null ? subtotal + shippingCost : null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'city') {
      if (value.trim().length > 0) {
        const filtered = BD_DISTRICTS.filter(item =>
          item.district.toLowerCase().includes(value.toLowerCase())
        );
        setCitySuggestions(filtered);
        setShowSuggestions(true);
      } else {
        setCitySuggestions([]);
        setShowSuggestions(false);
      }
    }
  };

  const handleSelectCity = (cityName: string) => {
    setFormData(prev => ({
      ...prev,
      city: cityName,
    }));
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.address ||
      !formData.city
    ) {
      alert('Please fill in all required fields');
      return;
    }
    if (formData.paymentMethod !== 'cod' && !transactionId.trim()) {
      alert('Please enter the transaction ID for your payment');
      return;
    }

    setIsProcessing(true);

    const orderPayload = {
      action: 'checkout',
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      paymentMethod: formData.paymentMethod,
      shippingCost: shippingCost,
      total: orderTotal,
      transactionId: transactionId || null,
      items: checkoutItems.map(item => ({
        product_id: item.product_id,
        name: item.name ?? item.products?.name ?? 'Feral Item',
        price: item.price ?? item.products?.price ?? 0,
        quantity: item.quantity,
        size: item.size,
      })),
    };

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Checkout failed');
      }

      const result = await res.json();

      if (isBuyNow) localStorage.removeItem('checkoutItem');
      localStorage.setItem('lastOrder', JSON.stringify(result));
      router.push('/order-confirmation');
    } catch (error: any) {
      alert('Error placing order: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!hasCheckedData && checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-6 h-6 border border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-[#f4f4f5] overflow-x-hidden">
      {/* HEADER */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ${
          scrolled
            ? 'bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/20'
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
            <Link href="/cart" className="text-[#d4d4d8] hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6" />
              </svg>
            </Link>
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
            <Link href="/cart" className="text-[#d4d4d8] hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <div className="h-14 md:h-16" />

      {/* CHECKOUT CONTENT */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-center mb-8">
          CHECKOUT
        </h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Order Summary Sidebar */}
          <div className="md:order-2">
            <div className="bg-[#18181b] border border-[#52525b]/20 p-6 sticky top-24">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4">
                ORDER SUMMARY
              </h2>
              <div className="space-y-4 mb-4 pb-4 border-b border-[#52525b]/20">
                {checkoutItems.map((item, index) => {
                  const name = item.name ?? item.products?.name ?? 'Feral Apparel';
                  const rawPrice = item.price ?? item.products?.price ?? 0;
                  const price = Number(rawPrice);
                  const image = formatImageUrl(item);
                  return (
                    <div
                      key={`${item.id}-${item.size}-${index}`}
                      className="flex gap-4 items-start"
                    >
                      <div className="w-20 h-24 bg-[#0a0a0a] overflow-hidden flex-shrink-0">
                        <img src={image} alt={name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium uppercase">{name}</h3>
                        <p className="text-xs text-[#a1a1aa]">Size: {item.size}</p>
                        <p className="text-xs text-[#a1a1aa]">Qty: {item.quantity}</p>
                        <p className="text-sm font-bold mt-1">
                          ৳{(price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#a1a1aa]">Subtotal</span>
                  <span>৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a1a1aa]">Shipping</span>
                  <span>
                    {shippingCost !== null ? (
                      `৳${shippingCost.toLocaleString()}`
                    ) : (
                      <span className="text-[#a1a1aa] italic">TBD</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#52525b]/20 font-bold">
                  <span>Total</span>
                  <span>
                    {orderTotal !== null ? (
                      `৳${orderTotal.toLocaleString()}`
                    ) : (
                      <span className="text-[#a1a1aa] italic">Select district</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="md:col-span-2 md:order-1">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Shipping Information */}
              <div className="bg-[#18181b] border border-[#52525b]/20 p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-4">
                  SHIPPING INFORMATION
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#a1a1aa] mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full bg-[#0a0a0a] border border-[#52525b]/30 rounded px-4 py-3 text-sm focus:outline-none focus:border-white text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#a1a1aa] mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-[#0a0a0a] border border-[#52525b]/30 rounded px-4 py-3 text-sm focus:outline-none focus:border-white text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#a1a1aa] mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-[#0a0a0a] border border-[#52525b]/30 rounded px-4 py-3 text-sm focus:outline-none focus:border-white text-white"
                    />
                  </div>

                  {/* Smart Autocomplete City Field */}
                  <div className="relative" ref={autocompleteRef}>
                    <label className="block text-xs text-[#a1a1aa] mb-1">
                      District *
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      autoComplete="off"
                      value={formData.city}
                      onChange={handleInputChange}
                      onFocus={() => formData.city && setShowSuggestions(true)}
                      className="w-full bg-[#0a0a0a] border border-[#52525b]/30 rounded px-4 py-3 text-sm focus:outline-none focus:border-white text-white"
                      placeholder="Type your district (e.g. Dhaka, Bogura)"
                    />
                    
                    {showSuggestions && citySuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-[#0a0a0a] border border-[#52525b]/50 z-50 rounded shadow-2xl custom-scrollbar">
                        {citySuggestions.map((cityObj) => (
                          <div
                            key={cityObj.district}
                            onClick={() => handleSelectCity(cityObj.district)}
                            className="px-4 py-3 text-sm cursor-pointer border-b border-[#52525b]/10 text-left text-zinc-300 hover:bg-white hover:text-black transition-colors duration-150 font-medium"
                          >
                            {cityObj.district}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Address and Postal Code */}
                  <div className="md:col-span-2">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs text-[#a1a1aa] mb-1">
                          Address (Area, House, Road No.) *
                        </label>
                        <input
                          type="text"
                          name="address"
                          required
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full bg-[#0a0a0a] border border-[#52525b]/30 rounded px-4 py-3 text-sm focus:outline-none focus:border-white text-white"
                          placeholder="e.g. House 42, Road 11"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#a1a1aa] mb-1">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          className="w-full bg-[#0a0a0a] border border-[#52525b]/30 rounded px-4 py-3 text-sm focus:outline-none focus:border-white text-white"
                          placeholder="e.g. 1230"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="bg-[#18181b] border border-[#52525b]/20 p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-4">
                  PAYMENT METHOD
                </h2>
                <div className="grid gap-3">
                  <label
                    className={`flex items-center justify-between p-4 border transition-all duration-300 cursor-pointer rounded select-none ${
                      formData.paymentMethod === 'cod'
                        ? 'border-white bg-[#27272a]'
                        : 'border-[#52525b]/30 bg-[#0a0a0a] hover:border-[#52525b]/70'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-4 h-4 border flex items-center justify-center transition-all duration-300 ${
                          formData.paymentMethod === 'cod'
                            ? 'border-white bg-white'
                            : 'border-[#52525b]/60 bg-transparent'
                        }`}
                      >
                        {formData.paymentMethod === 'cod' && (
                          <div className="w-2 h-2 bg-black" />
                        )}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Cash on Delivery
                      </span>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                  </label>

                  <label
                    className={`flex items-center justify-between p-4 border transition-all duration-300 cursor-pointer rounded select-none ${
                      formData.paymentMethod === 'bkash'
                        ? 'border-white bg-[#27272a]'
                        : 'border-[#52525b]/30 bg-[#0a0a0a] hover:border-[#52525b]/70'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-4 h-4 border flex items-center justify-center transition-all duration-300 ${
                          formData.paymentMethod === 'bkash'
                            ? 'border-white bg-white'
                            : 'border-[#52525b]/60 bg-transparent'
                        }`}
                      >
                        {formData.paymentMethod === 'bkash' && (
                          <div className="w-2 h-2 bg-black" />
                        )}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">
                        bKash
                      </span>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bkash"
                      checked={formData.paymentMethod === 'bkash'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                  </label>

                  <label
                    className={`flex items-center justify-between p-4 border transition-all duration-300 cursor-pointer rounded select-none ${
                      formData.paymentMethod === 'nagad'
                        ? 'border-white bg-[#27272a]'
                        : 'border-[#52525b]/30 bg-[#0a0a0a] hover:border-[#52525b]/70'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-4 h-4 border flex items-center justify-center transition-all duration-300 ${
                          formData.paymentMethod === 'nagad'
                            ? 'border-white bg-white'
                            : 'border-[#52525b]/60 bg-transparent'
                        }`}
                      >
                        {formData.paymentMethod === 'nagad' && (
                          <div className="w-2 h-2 bg-black" />
                        )}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Nagad
                      </span>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="nagad"
                      checked={formData.paymentMethod === 'nagad'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                  </label>
                </div>

                {formData.paymentMethod === 'bkash' && (
                  <div className="mt-6 border-t border-[#52525b]/20 pt-6">
                    <div className="space-y-3 text-sm">
                      <p className="text-white font-medium">
                        Send{' '}
                        <span className="font-bold">
                          ৳{orderTotal !== null ? orderTotal.toLocaleString() : '...'}
                        </span>{' '}
                        to:
                      </p>
                      <p className="font-mono text-lg bg-black px-4 py-3 border border-[#52525b]/30 text-white">
                        01795099068 (Send Money)
                      </p>
                      <p className="text-[#a1a1aa]">
                        After sending the payment, enter the bKash transaction ID
                        below.
                      </p>
                      <input
                        type="text"
                        placeholder="e.g. TRX123456789"
                        value={transactionId}
                        onChange={e => setTransactionId(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#52525b]/30 rounded px-4 py-3 text-sm focus:outline-none focus:border-white text-white"
                        required
                      />
                    </div>
                  </div>
                )}

                {formData.paymentMethod === 'nagad' && (
                  <div className="mt-6 border-t border-[#52525b]/20 pt-6">
                    <div className="space-y-3 text-sm">
                      <p className="text-white font-medium">
                        Send{' '}
                        <span className="font-bold">
                          ৳{orderTotal !== null ? orderTotal.toLocaleString() : '...'}
                        </span>{' '}
                        to:
                      </p>
                      <p className="font-mono text-lg bg-black px-4 py-3 border border-[#52525b]/30 text-white">
                        01540366437 (Send Money)
                      </p>
                      <p className="text-[#a1a1aa]">
                        After sending the payment, enter the Nagad transaction ID
                        below.
                      </p>
                      <input
                        type="text"
                        placeholder="e.g. TRX123456789"
                        value={transactionId}
                        onChange={e => setTransactionId(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#52525b]/30 rounded px-4 py-3 text-sm focus:outline-none focus:border-white text-white"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Link
                  href="/shop"
                  className="flex-1 py-3 px-6 text-center border border-[#52525b]/50 text-sm uppercase tracking-wider hover:border-white transition"
                >
                  BACK TO SHOP
                </Link>
                <button
                  type="submit"
                  disabled={isProcessing || shippingCost === null}
                  className={`flex-1 py-3 px-6 font-bold uppercase tracking-wider text-sm transition ${
                    isProcessing || shippingCost === null
                      ? 'bg-[#52525b] cursor-not-allowed'
                      : 'bg-white text-black hover:bg-[#d4d4d8]'
                  }`}
                >
                  {isProcessing ? 'PROCESSING...' : 'PLACE ORDER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="pt-12 pb-14 text-center border-t border-[#52525b]/20">
        <div className="text-[10px] tracking-[0.25em] text-[#52525b] uppercase">
          © 2026 UNTAMED. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
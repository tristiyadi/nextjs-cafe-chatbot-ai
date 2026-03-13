/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Search, Plus, Star, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  isPopular: boolean;
  imageUrl?: string | null;
  category: {
    name: string;
    slug: string;
  } | null;
}

export function MenuDisplay() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const addItem = useCart((state) => state.addItem);
  const cartItems = useCart((state) => state.items);
  const lastFetchRef = useRef<string>("");

  const cartQuantities = useMemo(() => {
    const counts: Record<string, number> = {};
    cartItems.forEach(item => {
      counts[item.menuItemId] = (counts[item.menuItemId] || 0) + item.quantity;
    });
    return counts;
  }, [cartItems]);

  const fetchMenu = useCallback(async (query = "", category = "all") => {
    const paramsKey = `${query}-${category}`;
    if (paramsKey === lastFetchRef.current) return;
    
    setLoading(true);
    lastFetchRef.current = paramsKey;
    try {
      let url = "/api/menu";
      if (query) {
        url = `/api/search?q=${encodeURIComponent(query)}`;
      } else if (category !== "all") {
        url = `/api/menu?category=${category}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      setItems(data.results || []);
    } catch (err) {
      console.error("Menu Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch categories
    fetch("/api/menu/categories")
      .then(res => res.json())
      .then(data => setCategories(data.results || []));
  }, []);

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialFetched = useRef(false);

  useEffect(() => {
    if (!hasInitialFetched.current) {
       hasInitialFetched.current = true;
       fetchMenu(search, activeCategory);
       return;
    }

    searchTimerRef.current = setTimeout(() => {
      fetchMenu(search, activeCategory);
    }, 500);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    }
  }, [search, activeCategory, fetchMenu]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    fetchMenu(search, activeCategory);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="relative flex-1 group">
           <Search className="absolute left-4 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
           <Input
             placeholder="Cari menu... (Coba ketik 'kopi segar')"
             className="pl-12 h-12 rounded-2xl shadow-sm border-primary/10 bg-background/50 focus-visible:ring-primary/20"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />
        </form>
        
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
           <Button 
             variant={activeCategory === "all" ? "default" : "outline"} 
             size="sm" 
             className="rounded-full px-5 h-10 shadow-sm transition-all"
             onClick={() => {
               setActiveCategory("all");
               setSearch("");
             }}
           >
             Semua
           </Button>
           {categories.map((c) => (
             <Button
               key={c.id}
               variant={activeCategory === c.slug ? "default" : "outline"}
               size="sm"
               className="rounded-full px-5 h-10 shadow-sm transition-all whitespace-nowrap"
               onClick={() => {
                 setActiveCategory(c.slug);
                 setSearch("");
               }}
             >
               {c.name}
             </Button>
           ))}
        </div>
      </div>

      <ScrollArea className="h-[500px] md:h-[60vh] lg:h-[70vh] border rounded-3xl p-4 md:p-6 bg-accent/5 backdrop-blur-sm border-primary/5 shadow-inner">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-primary/5 bg-white/50 animate-pulse overflow-hidden">
                <div className="h-40 bg-gray-200/50" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-3/4 bg-gray-200/50 rounded" />
                  <div className="h-3 w-full bg-gray-200/50 rounded" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-6 w-20 bg-gray-200/50 rounded" />
                    <div className="h-10 w-10 bg-gray-200/50 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
             <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center opacity-30">
                <Search className="h-10 w-10" />
             </div>
             <div>
                <h4 className="text-xl font-bold">Menu Tidak Ditemukan</h4>
                <p className="text-muted-foreground">Coba gunakan kata kunci lain atau tanya Barista AI.</p>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="group overflow-hidden rounded-2xl border-primary/5 hover:border-primary/20 hover:shadow-xl transition-all duration-300">
                <div className="h-48 bg-muted relative overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                   {item.imageUrl ? (
                     <img 
                       id={`item-img-${item.id}`}
                       src={item.imageUrl} 
                       alt={item.name} 
                       className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                     />
                   ) : (
                     <>
                       <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                       <Coffee className="h-12 w-12 text-primary/20" />
                     </>
                   )}
                   
                   {item.isPopular && (
                     <Badge className="absolute top-3 left-3 bg-amber-500/90 backdrop-blur-md hover:bg-amber-600 border-none shadow-lg gap-1 z-10">
                       <Star className="h-3 w-3 fill-current" /> Populer
                     </Badge>
                   )}
                   <Badge variant="secondary" className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider backdrop-blur-lg border-white/20 z-10">
                     {item.category?.name || "Lainnya"}
                   </Badge>

                   {cartQuantities[item.id] > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-[2px] z-0 animate-in fade-in duration-300">
                         <div className="bg-primary text-white h-12 w-12 rounded-full flex items-center justify-center shadow-2xl scale-110 border-4 border-background animate-in zoom-in duration-300">
                            <span className="font-black text-lg">x{cartQuantities[item.id]}</span>
                         </div>
                      </div>
                   )}
                </div>
                <CardHeader className="p-4 flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{item.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed h-8">
                    {item.description}
                  </p>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                   <div className="flex items-end justify-between">
                     <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Harga</span>
                        <span className="text-xl font-bold text-primary tracking-tight">Rp {parseFloat(item.price).toLocaleString('id-ID')}</span>
                     </div>
                     <Button 
                       id={`add-btn-${item.id}`}
                       size="icon" 
                       className="rounded-xl h-10 w-10 shadow-lg shadow-primary/20 pointer-events-auto transition-all active:scale-95 cursor-pointer hover:shadow-2xl hover:-translate-y-1"
                       onClick={(e) => {
                         e.stopPropagation();
                         
                         const sourceImg = document.getElementById(`item-img-${item.id}`);
                         const sourceBtn = document.getElementById(`add-btn-${item.id}`);
                         const targetCart = document.getElementById('cart-btn');
                         
                         const targetEl = sourceImg || sourceBtn;
                         
                         if (targetEl && targetCart) {
                           const start = targetEl.getBoundingClientRect();
                           const end = targetCart.getBoundingClientRect();
                           
                           const el = document.createElement('div');
                           el.className = "fixed z-[100] flex items-center justify-center rounded-2xl shadow-2xl pointer-events-none overflow-hidden bg-primary";
                           el.style.width = "40px"; el.style.height = "40px";
                           el.style.left = `${start.left}px`; el.style.top = `${start.top}px`;
                           
                           if (item.imageUrl) {
                             el.innerHTML = `<img src="${item.imageUrl}" class="w-full h-full object-cover" />`;
                           } else {
                             el.style.color = "white";
                             el.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`;
                           }
                           
                           document.body.appendChild(el);
                           
                           el.animate([
                             { left: `${start.left}px`, top: `${start.top}px`, transform: 'scale(2) rotate(0deg)', opacity: 1 },
                             { left: `${end.left + 5}px`, top: `${end.top + 5}px`, transform: 'scale(0.1) rotate(720deg)', opacity: 0 }
                           ], {
                             duration: 900,
                             easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                             fill: 'forwards'
                           }).onfinish = () => {
                             el.remove();
                             targetCart.animate([
                               { transform: 'scale(1)' },
                               { transform: 'scale(1.4)' },
                               { transform: 'scale(1)' }
                             ], { duration: 400 });
                           };
                         }

                         addItem({
                           menuItemId: item.id,
                           name: item.name,
                           price: parseFloat(item.price),
                           quantity: 1,
                         });
                       }}
                     >
                       <Plus className="h-6 w-6" />
                     </Button>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function Sparkles(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

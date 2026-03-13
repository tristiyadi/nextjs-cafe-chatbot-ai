/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { ChatBox } from "@/components/order/chat-box";
import { MenuDisplay } from "@/components/order/menu-display";
import { Navbar } from "@/components/layout/navbar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, MessageSquare, Utensils, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function OrderPage() {
  const [mounted, setMounted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  
  // Use a stable selector for total items to reduce re-renders
  const totalItems = useCart((state) => 
    state.items.reduce((acc, item) => acc + item.quantity, 0)
  );
  
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    const handle = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(handle);
  }, []);

  useEffect(() => {
    if (mounted && !isPending && session) {
      const role = (session.user as any).role;
      if (role === "admin" || role === "kitchen") {
        requestAnimationFrame(() => {
          setIsRedirecting(true);
          router.push(role === "admin" ? "/admin/menu" : "/kitchen");
        });
      }
    }
  }, [session, isPending, router, mounted]);

  // Only block for initial mount to avoid hydration mismatch
  if (!mounted || isRedirecting) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-black uppercase tracking-widest text-xs opacity-50">
            {isRedirecting ? "Alih Halaman..." : "Menyiapkan Pesanan..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-accent/10">
      <Navbar />
      
      <main className="flex-1 container max-w-7xl mx-auto px-6 md:px-12 py-6 md:py-10 relative">
        {/* Responsive Header Logic */}
        <div className="flex flex-col gap-6">
           <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                 <div className="bg-primary/10 p-2.5 rounded-2xl shadow-sm">
                   <Utensils className="h-5 w-5 text-primary" />
                 </div>
                 <h2 className="font-black text-2xl tracking-tight">Kafe <span className="text-primary italic font-serif">Order</span></h2>
              </div>
              
              {/* Desktop Cart Button */}
              {totalItems > 0 && (
                 <Link href="/order/cart" className="hidden md:block">
                    <Button variant="secondary" className="rounded-2xl h-12 px-6 font-bold gap-2 shadow-xl shadow-primary/5 animate-in fade-in zoom-in group border-primary/10 bg-white hover:bg-primary hover:text-white transition-all">
                      Keranjang ({totalItems}) <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                 </Link>
              )}
           </div>

           {/* Layout Wrapper */}
           <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] lg:grid-cols-[440px_1fr] gap-10">
              {/* Left Column (Always Chat on Desktop, Tabbed on Mobile) */}
              <div className={cn(
                "flex flex-col gap-6",
                activeTab !== 'chat' && "hidden md:flex"
              )}>
                <div className="hidden md:flex items-center gap-2 px-2 opacity-50">
                   <MessageSquare className="h-4 w-4" />
                   <span className="text-xs font-bold uppercase tracking-widest">AI Barista Assistant</span>
                </div>
                <ChatBox />
              </div>

              {/* Right Column (Always Menu on Desktop, Tabbed on Mobile) */}
              <div className={cn(
                "flex flex-col gap-6 overflow-hidden",
                activeTab !== 'menu' && "hidden md:flex"
              )}>
                 <div className="hidden md:flex items-center gap-2 px-2 opacity-50">
                    <Utensils className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Daftar Menu Kami</span>
                 </div>
                 <MenuDisplay />
              </div>
           </div>
        </div>

        {/* Mobile Navigation Tabs (Only Visible on Mobile) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-primary/5 p-4 flex flex-col gap-4">
           {/* Mobile Tab Trigger */}
           <Tabs value={activeTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12 rounded-full p-1 bg-muted">
                 <TabsTrigger 
                    value="chat" 
                    onClick={() => setActiveTab("chat")}
                    className="rounded-full gap-2"
                 >
                    <MessageSquare className="h-4 w-4" /> AI Chat
                 </TabsTrigger>
                 <TabsTrigger 
                    value="menu" 
                    onClick={() => setActiveTab("menu")}
                    className="rounded-full gap-2"
                 >
                    <Utensils className="h-4 w-4" /> Menu
                 </TabsTrigger>
              </TabsList>
           </Tabs>
        </div>

        {/* Mobile Floating Cart Summary */}
        {totalItems > 0 && (
           <div className="md:hidden fixed bottom-24 left-6 right-6 z-50 animate-in slide-in-from-bottom-10 h-16">
              <Link href="/order/cart">
                <Button className="w-full h-full rounded-2xl shadow-2xl shadow-primary/40 text-lg font-bold gap-3 flex items-center justify-between px-6">
                   <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-xl">
                        <ShoppingCart className="h-6 w-6" />
                      </div>
                      <div className="flex flex-col items-start translate-y-0.5">
                         <span className="text-[10px] uppercase tracking-wider opacity-80">Pesanan ({totalItems})</span>
                         <span>Lihat Keranjang</span>
                      </div>
                   </div>
                   <ArrowRight className="h-6 w-6" />
                </Button>
              </Link>
              <Badge className="absolute -top-2 -right-2 h-7 w-7 rounded-full flex items-center justify-center p-0 bg-amber-500 border-2 border-white text-white font-bold shadow-lg">
                {totalItems}
              </Badge>
           </div>
        )}
      </main>
    </div>
  );
}

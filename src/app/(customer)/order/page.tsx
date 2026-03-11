"use client";

import { useState } from "react";
import { ChatBox } from "@/components/order/chat-box";
import { MenuDisplay } from "@/components/order/menu-display";
import { Navbar } from "@/components/layout/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, MessageSquare, Utensils, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function OrderPage() {
  const [activeTab, setActiveTab] = useState("chat");
  const cartItems = useCart((state) => state.items);
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex flex-col min-h-screen bg-accent/10">
      <Navbar />
      
      <main className="flex-1 container max-w-7xl mx-auto px-6 md:px-12 py-6 md:py-10 relative">
        {/* Tablet & Desktop Split View (>= md) */}
        <div className="hidden md:grid md:grid-cols-[320px_1fr] lg:grid-cols-[440px_1fr] gap-10 h-[calc(100dvh-180px)]">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-2 px-2">
               <div className="bg-primary/10 p-2.5 rounded-2xl shadow-sm">
                 <MessageSquare className="h-5 w-5 text-primary" />
               </div>
               <h2 className="font-black text-2xl tracking-tight">Barista <span className="text-primary italic font-serif">AI</span></h2>
            </div>
            <ChatBox />
          </div>
          <div className="flex flex-col gap-6 overflow-hidden">
             <div className="flex items-center justify-between mb-2 px-2">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2.5 rounded-2xl shadow-sm">
                    <Utensils className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="font-black text-2xl tracking-tight">Pilih <span className="text-primary italic font-serif">Menu</span></h2>
                </div>
                {totalItems > 0 && (
                   <Link href="/order/cart">
                      <Button variant="secondary" className="rounded-2xl h-12 px-6 font-bold gap-2 shadow-xl shadow-primary/5 animate-in fade-in zoom-in group border-primary/10 bg-white hover:bg-primary hover:text-white transition-all">
                        Keranjang ({totalItems}) <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                   </Link>
                )}
             </div>
             <MenuDisplay />
          </div>
        </div>

        {/* Mobile View (< md) */}
        <div className="md:hidden flex flex-col gap-4 pb-24">
          <Tabs value={activeTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-12 rounded-full p-1 bg-muted">
              <TabsTrigger 
                value="chat" 
                onClick={() => setActiveTab("chat")}
                className={`rounded-full gap-2 ${activeTab === 'chat' ? 'bg-background shadow-md' : ''}`}
              >
                <MessageSquare className="h-4 w-4" /> AI Chat
              </TabsTrigger>
              <TabsTrigger 
                value="menu" 
                onClick={() => setActiveTab("menu")}
                className={`rounded-full gap-2 ${activeTab === 'menu' ? 'bg-background shadow-md' : ''}`}
              >
                <Utensils className="h-4 w-4" /> Menu
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="mt-0">
               <ChatBox />
            </TabsContent>
            
            <TabsContent value="menu" className="mt-0">
               <MenuDisplay />
            </TabsContent>
          </Tabs>
        </div>

        {/* Mobile Floating Cart Summary (< md) */}
        {totalItems > 0 && (
           <div className="md:hidden fixed bottom-6 left-6 right-6 z-50 animate-in slide-in-from-bottom-10 h-16">
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

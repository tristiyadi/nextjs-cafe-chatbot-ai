"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Coffee, Clock, CheckCircle2, Package, RefreshCcw, ArrowRight, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface OrderItem {
  quantity: number;
  menuItem?: {
    name: string;
  } | null;
}

interface Order {
  id: string;
  customerName: string;
  tableNumber: string;
  totalAmount: string;
  status: "pending" | "accepted" | "preparing" | "ready" | "completed" | "cancelled";
  createdAt: string;
  items: OrderItem[];
}

const statusConfig = {
  pending: { label: "Menunggu", icon: <Clock className="h-4 w-4" />, color: "bg-amber-100 text-amber-700 border-amber-200" },
  accepted: { label: "Diterima", icon: <CheckCircle2 className="h-4 w-4" />, color: "bg-sky-100 text-sky-700 border-sky-200" },
  preparing: { label: "Diproses", icon: <RefreshCcw className="h-4 w-4 animate-spin-slow" />, color: "bg-blue-100 text-blue-700 border-blue-200" },
  ready: { label: "Siap", icon: <Package className="h-4 w-4" />, color: "bg-green-100 text-green-700 border-green-200" },
  completed: { label: "Selesai", icon: <CheckCircle2 className="h-4 w-4" />, color: "bg-gray-100 text-gray-600 border-gray-200" },
  cancelled: { label: "Dibatalkan", icon: <CheckCircle2 className="h-4 w-4 rotate-45" />, color: "bg-red-100 text-red-700 border-red-200" },
};

export default function OrderTrackPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data.results || []);
    } catch (err) {
      console.error("Orders Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Poll every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-accent/10">
      <Navbar />
      
      <main className="flex-1 container max-w-5xl mx-auto px-6 md:px-12 py-10 md:py-16">
        <div className="flex flex-col gap-10 md:gap-16 transition-all duration-700">
          <div className="flex flex-col gap-4 text-center md:text-left">
             <Badge variant="outline" className="w-fit border-primary/20 bg-primary/5 text-primary rounded-full px-4 self-center md:self-start mb-2 uppercase tracking-widest text-[10px] font-bold py-1">Live Update</Badge>
             <h1 className="text-4xl md:text-5xl lg:text-7xl font-black font-serif text-foreground leading-tight italic tracking-tighter">Pesanan <span className="text-primary italic">Anda</span></h1>
             <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-2xl">Lacak status pesanan Anda secara real-time. Hubungi barista jika ada kendala.</p>
          </div>

          <div className="grid gap-6 md:gap-8">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="rounded-[2.5rem] border-primary/5 shadow-md h-40 animate-pulse bg-muted/20" />
              ))
            ) : orders.length === 0 ? (
              <Card className="rounded-[3rem] p-16 text-center border-dashed border-2 flex flex-col items-center gap-8 border-primary/10 bg-background/50">
                 <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center opacity-40 shadow-inner">
                    <Coffee className="h-12 w-12" />
                 </div>
                 <div className="space-y-3">
                    <h3 className="text-3xl font-black tracking-tight">Belum Ada Pesanan</h3>
                    <p className="text-muted-foreground text-lg">Pesan menu favoritmu dan lacak setiap langkah pembuatannya di sini.</p>
                 </div>
                 <Link href="/order">
                    <Button size="lg" className="rounded-2xl px-12 h-16 text-xl font-bold shadow-2xl shadow-primary/20 transition-all hover:scale-105">Mulai Pesan <ArrowRight className="ml-2 h-6 w-6" /></Button>
                 </Link>
              </Card>
            ) : (
              orders.map((order) => {
                const config = statusConfig[order.status];
                return (
                  <Card key={order.id} className="group rounded-[2.5rem] overflow-hidden border-primary/5 shadow-lg hover:shadow-2xl hover:border-primary/20 transition-all duration-500 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="p-8 md:p-10 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-accent/5">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                             <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em]">ID Pesanan</span>
                             <span className="font-mono text-xs opacity-50 bg-muted px-2 py-0.5 rounded">#{order.id.slice(-6).toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-3">
                             <div className="flex items-center gap-2 bg-background border border-primary/10 px-5 py-2 rounded-2xl shadow-sm text-base font-black">
                                <Table className="h-5 w-5 text-primary" /> Meja {order.tableNumber}
                             </div>
                             <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold px-1">
                                <Clock className="h-4 w-4 opacity-50" /> {new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                             </div>
                          </div>
                       </div>
                       
                       <div className={cn("flex items-center gap-3 px-8 py-3 rounded-2xl border shadow-sm font-black text-sm tracking-widest transition-all scale-100 group-hover:scale-105", config.color)}>
                          {config.icon}
                          <span>{config.label.toUpperCase()}</span>
                       </div>
                    </CardHeader>
                    
                    <CardContent className="p-8 md:p-10 pt-6">
                       <div className="grid md:grid-cols-[1fr_280px] gap-10">
                          <div className="flex flex-col gap-6">
                             <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70 px-1">Ringkasan Pesanan</div>
                             <div className="flex flex-wrap gap-3">
                                {order.items.map((item, idx) => (
                                   <div key={idx} className="flex items-center gap-3 bg-muted/40 border border-primary/5 px-4 py-2.5 rounded-2xl text-sm font-bold shadow-sm hover:bg-white transition-colors duration-300">
                                      <span className="h-6 w-6 rounded-lg bg-primary text-white text-[10px] flex items-center justify-center font-black shadow-md shadow-primary/20">{item.quantity}</span>
                                      {item.menuItem?.name || "Menu Nusantara"}
                                   </div>
                                ))}
                             </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 justify-end text-right">
                             <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-70">Total Pembayaran</span>
                             <span className="text-4xl font-black text-primary tracking-tighter">Rp {parseFloat(order.totalAmount).toLocaleString('id-ID')}</span>
                          </div>
                       </div>
                    </CardContent>
                    
                    <div className="border-t border-primary/5 bg-accent/5 px-8 md:px-10 py-5 flex justify-between items-center group-hover:bg-primary/5 transition-colors">
                       <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Status Update: {new Date().toLocaleTimeString('id-ID')}</p>
                       {order.status === "ready" && (
                         <div className="flex items-center gap-2 text-green-600 font-black text-xs uppercase tracking-widest animate-pulse">
                            Siap Diambil <ArrowRight className="h-4 w-4" />
                         </div>
                       )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

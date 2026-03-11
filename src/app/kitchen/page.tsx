"use client";

import { useState, useEffect } from "react";
import { Coffee, AlertCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

interface OrderItem {
  quantity: number;
  notes?: string;
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
  notes?: string;
  createdAt: string;
  items: OrderItem[];
}

const statusOptions = [
  { value: "pending", label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "accepted", label: "Diterima", color: "bg-sky-100 text-sky-700 border-sky-200" },
  { value: "preparing", label: "Proses", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "ready", label: "Siap", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "completed", label: "Selesai", color: "bg-gray-100 text-gray-600 border-gray-200" },
];

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session, isPending } = authClient.useSession();

  const fetchOrders = async () => {
    try {
      // Use the active orders endpoint for the kitchen dashboard
      const res = await fetch("/api/orders/active");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.results || []);
      } else {
        // Fallback to all orders if active endpoint fails (e.g. auth issue)
        const fallback = await fetch("/api/orders");
        const data = await fallback.json();
        setOrders(data.results || []);
      }
    } catch (err) {
      console.error("Kitchen Orders Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchOrders();
    } catch (err) {
      console.error("Status Update Error:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // 10s poll
    return () => clearInterval(interval);
  }, [session, isPending]);

  const activeOrdersCount = orders.filter(o => o.status !== "completed" && o.status !== "cancelled").length;

  return (
    <div className="flex flex-col min-h-screen bg-neutral-900 text-white">
      {/* Kitchen Navbar */}
      <header className="h-20 min-h-[5rem] border-b border-white/10 bg-black/40 backdrop-blur sticky top-0 z-50 px-6 md:px-12 flex items-center justify-between transition-all">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter text-amber-500">
               <Coffee className="h-8 w-8" />
               <span>KITCHEN<span className="text-white">OS</span></span>
            </div>
            <Separator orientation="vertical" className="h-8 bg-white/10" />
            <div className="flex flex-col">
               <span className="text-[10px] uppercase tracking-widest text-amber-500/80 font-bold">Active Orders</span>
               <span className="text-xl font-mono font-bold">{activeOrdersCount}</span>
            </div>
         </div>
         
         <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="rounded-full border-white/10 bg-white/5 hover:bg-white/10">
               <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
               <div className="text-right flex flex-col">
                  <span className="text-xs font-bold">{session?.user.name || "Chef Mode"}</span>
                  <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Kitchen Staff</span>
               </div>
               <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center font-bold text-black border-2 border-amber-400">
                  {session?.user.name?.charAt(0) || "C"}
               </div>
            </div>
         </div>
      </header>
      
      <main className="flex-1 container max-w-[100vw] mx-auto px-6 md:px-12 py-8 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-6 md:gap-8 auto-rows-max">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="bg-white/5 border-white/10 h-[400px] animate-pulse rounded-3xl" />
            ))
          ) : activeOrdersCount === 0 ? (
            <div className="col-span-full h-[60vh] flex flex-col items-center justify-center gap-6 opacity-40">
               <Coffee className="h-32 w-32" />
               <p className="text-3xl font-serif italic text-center max-w-md">Belum ada pesanan masuk. Santai sejenak sepertinya enak.</p>
            </div>
          ) : (
            orders.filter(o => o.status !== "completed" && o.status !== "cancelled").map((order) => (
              <Card key={order.id} className={cn(
                "rounded-[2.5rem] bg-neutral-800 border-none shadow-2xl flex flex-col group overflow-hidden transition-all duration-300 ring-2",
                order.status === "pending" ? "ring-amber-500/50" : "ring-white/5"
              )}>
                <CardHeader className="p-6 pb-2 border-b border-white/5 bg-black/20">
                   <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                         <span className="text-[10px] font-bold tracking-widest text-amber-500 uppercase">TABLE</span>
                         <span className="text-3xl font-mono font-bold leading-none">{order.tableNumber}</span>
                      </div>
                      <Badge className={cn(
                        "rounded-full px-4 py-1 font-bold text-[10px] tracking-widest border-none",
                        statusOptions.find(s => s.value === order.status)?.color
                      )}>
                        {statusOptions.find(s => s.value === order.status)?.label.toUpperCase()}
                      </Badge>
                   </div>
                   <p className="text-xs text-white/40 mt-3 font-mono">#{order.id.slice(-6).toUpperCase()} • {order.customerName} • {new Date(order.createdAt).toLocaleTimeString('id-ID')}</p>
                </CardHeader>
                
                <CardContent className="p-6 flex-1 flex flex-col gap-5">
                   <div className="flex flex-col gap-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-start bg-white/5 p-3 rounded-2xl border border-white/5 shadow-inner">
                           <div className="h-8 w-8 rounded-lg bg-amber-500 text-black flex items-center justify-center font-bold text-sm shrink-0">
                              {item.quantity}x
                           </div>
                           <div className="flex flex-col">
                              <span className="font-bold text-sm leading-tight text-white/90">{item.menuItem?.name}</span>
                              {item.notes && <span className="text-[10px] text-amber-500/80 font-bold italic font-serif">{item.notes}</span>}
                           </div>
                        </div>
                      ))}
                   </div>
                   
                   {order.notes && (
                     <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3 items-start">
                        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-200/90 leading-relaxed font-medium">NB: {order.notes}</p>
                     </div>
                   )}
                </CardContent>
                
                <CardFooter className="p-4 grid grid-cols-2 gap-2 bg-black/40">
                   {order.status === "pending" && (
                     <Button className="col-span-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-2xl h-12" onClick={() => updateStatus(order.id, "accepted")}>
                        TERIMA PESANAN
                     </Button>
                   )}
                   {order.status === "accepted" && (
                     <Button className="col-span-2 bg-blue-500 hover:bg-blue-600 text-black font-bold rounded-2xl h-12" onClick={() => updateStatus(order.id, "preparing")}>
                        MULAI PROSES
                     </Button>
                   )}
                   {order.status === "preparing" && (
                     <Button className="col-span-2 bg-green-500 hover:bg-green-600 text-black font-bold rounded-2xl h-12" onClick={() => updateStatus(order.id, "ready")}>
                        SIAP DIAMBIL
                     </Button>
                   )}
                   {order.status === "ready" && (
                     <Button className="col-span-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-2xl h-12" onClick={() => updateStatus(order.id, "completed")}>
                        SELESAIKAN ORDER
                     </Button>
                   )}
                   {order.status !== "completed" && (
                      <Button variant="ghost" className="col-span-2 text-white/40 hover:text-red-400 text-[10px] font-bold" onClick={() => updateStatus(order.id, "cancelled")}>
                         BATALKAN PESANAN
                      </Button>
                   )}
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

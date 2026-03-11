"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { useCart } from "@/hooks/use-cart";
import { Coffee, Trash2, Plus, Minus, ArrowLeft, Loader2, CheckCircle2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getTotal } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { data: session } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.name && !customerName) {
      setCustomerName(session.user.name);
    }
  }, [session, customerName]);

  const placeOrder = async () => {
    if (!customerName || !tableNumber) {
      alert("Harap isi nama dan nomor meja Anda.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          tableNumber,
          notes,
          items: items.map(i => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            unitPrice: i.price,
            subtotal: i.price * i.quantity,
          })),
          totalAmount: getTotal(),
        }),
      });

      if (res.ok) {
        setSuccess(true);
        clearCart();
        // Redirect to tracking page after 2 seconds
        setTimeout(() => router.push("/order/track"), 2000);
      }
    } catch (err) {
      console.error("Order Place Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-accent/20 flex flex-col items-center justify-center p-8 gap-6 animate-in zoom-in-95 fade-in duration-300">
         <div className="bg-primary p-6 rounded-full text-primary-foreground shadow-2xl shadow-primary/40 mb-4 animate-bounce">
            <CheckCircle2 className="h-16 w-16" />
         </div>
         <h1 className="text-4xl font-black font-serif text-center italic tracking-tighter">Pesanan <span className="text-primary italic">Terkirim!</span></h1>
         <p className="text-muted-foreground text-center max-w-sm text-lg font-medium">Barista kami sedang menyiapkan pesanan Anda. Anda akan segera dialihkan ke halaman pelacakan.</p>
         <Link href="/order/track">
            <Button size="lg" className="rounded-2xl px-12 h-14 text-lg font-bold shadow-xl shadow-primary/20">Lacak Sekarang</Button>
         </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-accent/10">
      <Navbar />
      
      <main className="flex-1 container max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-16">
        <div className="flex items-center gap-4 mb-12">
           <Link href="/order">
             <Button variant="ghost" size="icon" className="rounded-full hover:bg-background shadow-sm h-12 w-12 transition-all">
                <ArrowLeft className="h-6 w-6" />
             </Button>
           </Link>
           <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground leading-tight">Konfirmasi <span className="text-primary italic font-serif">Pesanan</span></h1>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-8">
             <div className="h-32 w-32 bg-muted rounded-full flex items-center justify-center shadow-inner opacity-40">
                <ShoppingBag className="h-16 w-16" />
             </div>
             <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Keranjang Anda Kosong</h2>
                <p className="text-muted-foreground">Yuk tambahkan menu favoritmu sekarang.</p>
             </div>
             <Link href="/order">
                <Button size="lg" className="rounded-2xl px-10 h-14 text-lg font-bold gap-3 shadow-xl">
                  Lihat Menu <ArrowLeft className="rotate-180 h-5 w-5" />
                </Button>
             </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_420px] gap-12 text-left">
            {/* Items List */}
            <div className="space-y-6">
               <Card className="rounded-[2.5rem] shadow-xl border-primary/5 bg-background/50 backdrop-blur overflow-hidden">
                  <CardHeader className="p-8 pb-4">
                     <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
                        <ShoppingBag className="h-6 w-6 text-primary" />
                        Detail Menu ({items.length})
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 flex flex-col gap-8">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-6 group animate-in slide-in-from-left-4">
                         <div className="h-24 w-24 bg-muted rounded-[1.5rem] flex items-center justify-center border border-primary/5 flex-shrink-0">
                            <Coffee className="h-10 w-10 text-primary/30" />
                         </div>
                         <div className="flex-1 flex flex-col justify-between py-1">
                            <div className="flex justify-between items-start">
                               <div>
                                  <h4 className="font-black text-xl leading-none mb-1 group-hover:text-primary transition-colors tracking-tight">{item.name}</h4>
                                  <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Rp {item.price.toLocaleString('id-ID')}</span>
                               </div>
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl" 
                                 onClick={() => removeItem(item.id)}
                               >
                                  <Trash2 className="h-5 w-5" />
                               </Button>
                            </div>
                            <div className="flex items-center gap-4 mt-4">
                               <div className="flex items-center gap-2 bg-muted p-1.5 rounded-2xl shadow-inner border border-primary/5">
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 rounded-xl hover:bg-background transition-all"
                                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                  >
                                     <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-8 text-center text-base font-black">{item.quantity}</span>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 rounded-xl hover:bg-background shadow-sm transition-all"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  >
                                     <Plus className="h-4 w-4" />
                                  </Button>
                               </div>
                               <span className="ml-auto font-black text-2xl tracking-tighter text-foreground/80">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                            </div>
                         </div>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter className="bg-primary/5 p-8 flex flex-col gap-3">
                     <div className="flex justify-between w-full">
                        <span className="font-bold text-lg uppercase tracking-widest text-muted-foreground">Total Pesanan</span>
                        <span className="text-3xl font-black text-primary tracking-tighter">Rp {getTotal().toLocaleString('id-ID')}</span>
                     </div>
                  </CardFooter>
               </Card>
            </div>

            {/* Form Section */}
            <div className="flex flex-col gap-6">
               <Card className="rounded-[3rem] shadow-2xl border-primary/10 bg-background p-8 md:p-10 sticky top-24">
                  <div className="flex flex-col gap-10">
                      <div className="flex flex-col gap-3">
                        <h3 className="text-2xl md:text-3xl font-black font-serif italic tracking-tight">Lengkapi <span className="text-primary italic">Info</span></h3>
                        <p className="text-muted-foreground leading-relaxed font-medium">Pastikan kita punya detail yang benar agar barista AI bisa memproses dengan cepat.</p>
                      </div>
                     
                     <div className="flex flex-col gap-6">
                        <div className="space-y-2.5">
                           <label className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground px-2">Nama Anda</label>
                           <Input 
                             placeholder="Masukkan nama lengkap" 
                             className="h-16 rounded-[1.25rem] border-primary/10 bg-accent/5 focus-visible:ring-primary/20 text-lg px-6 font-medium shadow-inner"
                             value={customerName}
                             onChange={(e) => setCustomerName(e.target.value)}
                           />
                        </div>
                        <div className="space-y-2.5">
                           <label className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground px-2">Nomor Meja</label>
                           <Input 
                             placeholder="Cth: 12 atau Booth 3" 
                             className="h-16 rounded-[1.25rem] border-primary/10 bg-accent/5 focus-visible:ring-primary/20 text-lg px-6 font-medium shadow-inner"
                             value={tableNumber}
                             onChange={(e) => setTableNumber(e.target.value)}
                           />
                        </div>
                        <div className="space-y-2.5">
                           <label className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground px-2">Catatan Pesanan</label>
                           <Input 
                             placeholder="Cth: Kurangi gula, atau panas sekali" 
                             className="h-16 rounded-[1.25rem] border-primary/10 bg-accent/5 focus-visible:ring-primary/20 text-lg px-6 font-medium shadow-inner"
                             value={notes}
                             onChange={(e) => setNotes(e.target.value)}
                           />
                        </div>
                     </div>

                     <Separator className="bg-primary/10" />
                     
                     <div className="flex flex-col gap-5">
                        <Button 
                          className="w-full h-20 rounded-[2.5rem] text-xl font-black shadow-2xl shadow-primary/40 gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] group" 
                          onClick={placeOrder}
                          disabled={loading}
                        >
                           {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : <>Konfirmasi & Bayar <ArrowLeft className="rotate-180 h-7 w-7 transition-transform group-hover:translate-x-2" /></>}
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground px-4 font-bold uppercase tracking-widest opacity-60">Barista AI Siap Memproses Pesanan Anda</p>
                     </div>
                  </div>
               </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

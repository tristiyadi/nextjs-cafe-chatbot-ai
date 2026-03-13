/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { Coffee, ShoppingCart, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useEffect, useState } from "react";

export function Navbar() {
  const { data: session } = authClient.useSession();
  const pathname = usePathname();
  const cartItems = useCart((state) => state.items);
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  
  // Mounted check to avoid hydration mismatch with local storage persistence
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const handle = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(handle);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/5 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto flex h-20 items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-3 group transition-all">
            <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
              <Coffee className="h-6 w-6" />
            </div>
            <span className="font-black text-xl tracking-tighter">Kafe <span className="text-primary italic font-serif">Nusantara</span></span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {!(session?.user as any)?.role || (session?.user as any)?.role === "customer" ? (
            <>
              <Link href="/order" className="text-xs font-black uppercase tracking-[0.2em] hover:text-primary transition-all">
                Pesan
              </Link>
              <Link href="/menu" className="text-xs font-black uppercase tracking-[0.2em] hover:text-primary transition-all">
                Menu
              </Link>
              <Link href="/order/track" className="text-xs font-black uppercase tracking-[0.2em] hover:text-primary transition-all">
                Lacak
              </Link>
            </>
          ) : (
            <Link href={(session?.user as any)?.role === "admin" ? "/admin" : "/kitchen"} className="text-xs font-black uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-all flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Lihat Dashboard Kitchen
            </Link>
          )}
          
          {(session?.user as any)?.role === "kitchen" && (
             <Link href="/kitchen" className="text-xs font-black uppercase tracking-[0.2em] text-amber-600 hover:text-amber-500 transition-all flex items-center gap-2">
               Kitchen
             </Link>
          )}

          {(session?.user as any)?.role === "admin" && (
            <Link 
              href="/admin/menu" 
              className={cn(
                "text-xs font-black uppercase tracking-[0.2em] transition-all",
                pathname === "/admin/menu" ? "text-primary flex items-center gap-2" : "text-amber-600 hover:text-amber-500"
              )}
            >
              {pathname === "/admin/menu" && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
              Manage Menu
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {(!(session?.user as any)?.role || (session?.user as any)?.role === "customer") && (
            <Link href="/order/cart" id="cart-btn">
              <Button variant="ghost" size="icon" className="relative rounded-2xl h-11 w-11 bg-accent/5 hover:bg-primary hover:text-white transition-all group/cart">
                <ShoppingCart className="h-5 w-5" />
                {mounted && totalItems > 0 && (
                   <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white ring-2 ring-background animate-in zoom-in group-hover/cart:scale-110 transition-transform">
                     {totalItems}
                   </span>
                )}
              </Button>
            </Link>
          )}
          
          {session ? (
            <div className="flex items-center gap-3 ml-2 pl-4 border-l border-primary/10">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">{(!(session?.user as any)?.role || (session?.user as any)?.role === "customer" ? 'Pelanggan' : (session?.user as any)?.role === "admin" ? 'Administrator' : 'Kitchen')}</span>
                <span className="text-sm font-bold tracking-tight">{session.user.name.split(" ")[0]}</span>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-11 w-11 rounded-2xl border-primary/10 hover:bg-red-50 hover:text-red-500 transition-all"
                onClick={() => authClient.signOut()}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20">Masuk</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

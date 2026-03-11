/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { Coffee, ShoppingCart, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { data: session } = authClient.useSession();

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
          <Link href="/order" className="text-xs font-black uppercase tracking-[0.2em] hover:text-primary transition-all">
            Pesan
          </Link>
          <Link href="/menu" className="text-xs font-black uppercase tracking-[0.2em] hover:text-primary transition-all">
            Menu
          </Link>
          <Link href="/order/track" className="text-xs font-black uppercase tracking-[0.2em] hover:text-primary transition-all">
            Lacak
          </Link>
          {(session?.user as any)?.role === "kitchen" || (session?.user as any)?.role === "admin" ? (
            <Link href="/kitchen" className="text-xs font-black uppercase tracking-[0.2em] text-amber-600 hover:text-amber-500 transition-all flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Kitchen
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/order/cart">
            <Button variant="ghost" size="icon" className="relative rounded-2xl h-11 w-11 bg-accent/5 hover:bg-primary hover:text-white transition-all">
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </Link>
          
          {session ? (
            <div className="flex items-center gap-3 ml-2 pl-4 border-l border-primary/10">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Pelanggan</span>
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

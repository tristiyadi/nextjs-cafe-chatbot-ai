/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Coffee, Search, ArrowRight, Star, CheckCircle2, Zap, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/navbar";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      
      <main className="flex-1">
        {/* Modern Hero Section */}
        <section className="relative pt-20 pb-16 md:pt-32 md:pb-28 overflow-hidden bg-gradient-to-b from-primary/5 via-accent/5 to-background">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none overflow-hidden">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
               <defs>
                 <pattern id="dotGrid" width="4" height="4" patternUnits="userSpaceOnUse">
                   <circle cx="2" cy="2" r="1.5" fill="currentColor" />
                 </pattern>
               </defs>
               <rect width="100%" height="100%" fill="url(#dotGrid)" />
            </svg>
          </div>

          <div className="container relative z-10 px-6 md:px-12 lg:px-8">
            <div className="grid gap-12 md:grid-cols-2 items-center md:items-start lg:items-center">
              <div className="flex flex-col gap-6 max-w-2xl mx-auto md:mx-0 text-center md:text-left animate-in fade-in slide-in-from-left-8 duration-700">
                <div className="flex justify-center md:justify-start">
                  <Badge variant="outline" className="py-1 px-3 rounded-full border-primary/20 bg-primary/5 text-primary text-xs md:text-sm font-semibold tracking-wide">
                    ✨ Barista AI Tersedia Sekarang
                  </Badge>
                </div>
                
                <div className="flex flex-col gap-3 md:gap-4">
                  <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-7xl xl:text-8xl font-black tracking-tight text-foreground leading-[1.1]">
                    Ngopi Cerdas <br />
                    <span className="text-primary italic font-serif">Lebih Dekat</span>
                  </h1>
                  <p className="text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto md:mx-0">
                    Gabungkan kemudahan teknologi AI dengan kehangatan rasa kopi Nusantara. Pesan favoritmu hanya dengan bercakap santai.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4 pt-2 md:pt-4">
                  <Link href="/order">
                    <Button size="lg" className="rounded-2xl h-14 md:h-16 px-8 md:px-10 text-base md:text-lg font-bold gap-3 shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95">
                      Pesan Lewat AI <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/menu">
                    <Button size="lg" variant="outline" className="rounded-2xl h-14 md:h-16 px-8 md:px-10 text-base md:text-lg font-semibold border-primary/10 hover:bg-primary/5 hover:text-primary transition-all backdrop-blur-sm">
                      Eksplor Menu
                    </Button>
                  </Link>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-6 lg:gap-8 pt-6 md:pt-8 border-t border-primary/10 mt-2">
                  <div className="flex flex-col">
                    <span className="text-xl md:text-2xl font-bold">50+</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Menu Nusantara</span>
                  </div>
                  <div className="w-px h-8 bg-primary/10" />
                  <div className="flex flex-col">
                    <span className="text-xl md:text-2xl font-bold">1k+</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Pecinta Kopi</span>
                  </div>
                  <div className="w-px h-8 bg-primary/10" />
                  <div className="flex flex-col">
                    <span className="text-xl md:text-2xl font-bold">4.9/5</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Rating AI</span>
                  </div>
                </div>
              </div>
              
              <div className="relative max-w-md md:max-w-none mx-auto md:mx-0 animate-in fade-in slide-in-from-right-12 duration-1000 delay-200">
                <div className="absolute -inset-8 md:-inset-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl opacity-50" />
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/30 rounded-[2.5rem] md:rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                  <img 
                    src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2000&auto=format&fit=crop" 
                    alt="Premium Coffee" 
                    className="relative rounded-[2.5rem] md:rounded-[3rem] shadow-2xl object-cover aspect-[4/5] lg:aspect-square w-full"
                  />
                  
                  {/* Floating Elements for Premium Feel */}
                  <Card className="absolute -bottom-6 -left-6 md:-bottom-10 md:-left-10 max-w-[180px] md:max-w-[240px] shadow-2xl border-white/20 bg-white/70 backdrop-blur-xl rounded-2xl md:rounded-3xl animate-bounce-slow">
                    <CardContent className="p-3 md:p-5 flex flex-col gap-2 md:gap-3">
                      <div className="flex -space-x-3 mb-1">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="h-6 w-6 md:h-8 md:w-8 rounded-full border-2 border-white bg-muted items-center justify-center flex overflow-hidden">
                            <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="avatar" />
                          </div>
                        ))}
                        <div className="h-6 w-6 md:h-8 md:w-8 rounded-full border-2 border-white bg-primary text-[8px] md:text-[10px] text-white flex items-center justify-center font-bold px-1">+12</div>
                      </div>
                      <p className="text-xs md:text-sm font-bold leading-tight">&quot;Barista AI-nya benar-benar tahu seleraku!&quot;</p>
                      <div className="flex items-center gap-1 md:gap-1.5 pt-0.5 md:pt-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-2.5 w-2.5 md:h-3 md:w-3 fill-amber-500 text-amber-500" />)}
                        </div>
                        <p className="text-[8px] md:text-[10px] font-bold text-primary">REKOMENDASI TERBAIK</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="absolute -top-4 -right-4 md:-top-10 md:-right-10 h-24 w-24 md:h-32 md:w-32 bg-primary rounded-full flex flex-col items-center justify-center text-primary-foreground shadow-2xl rotate-12 animate-pulse-slow">
                    <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase">Promo</span>
                    <span className="text-2xl md:text-3xl font-black tracking-tighter">15%</span>
                    <span className="text-[8px] md:text-[10px] font-medium opacity-80">First Order</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-24 md:py-32 container px-6 md:px-12">
          <div className="text-center max-w-3xl mx-auto mb-20 flex flex-col gap-5">
            <Badge variant="outline" className="w-fit mx-auto border-primary/20 bg-primary/5 text-primary">Keunggulan Kami</Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Evolusi Cara Menikmati <span className="text-primary italic font-serif">Kopi</span></h2>
            <p className="text-lg text-muted-foreground leading-relaxed">Kami memadukan teknik brewing tradisional dengan kecerdasan buatan untuk menciptakan standar baru dalam industri kafe.</p>
          </div>
          
          <div className="grid gap-10 md:grid-cols-3">
            {[
              {
                title: "Kecerdasan Buatan",
                desc: "Chatbot kami menggunakan Llama 3.2 untuk memahami keinginan Anda secara mendalam.",
                icon: <Zap className="h-10 w-10 text-primary" />,
                color: "bg-blue-500"
              },
              {
                title: "Semantic Search",
                desc: "Cukup ketik 'sesuatu yang hangat dan rasa kelapa', AI akan menemukan menu yang tepat.",
                icon: <Search className="h-10 w-10 text-primary" />,
                color: "bg-amber-500"
              },
              {
                title: "Asli Nusantara",
                desc: "Semua bahan baku kami diambil langsung dari petani lokal di seluruh penjuru Indonesia.",
                icon: <CheckCircle2 className="h-10 w-10 text-primary" />,
                color: "bg-emerald-500"
              },
            ].map((f, i) => (
              <Card key={i} className="group border-none shadow-xl shadow-accent/5 bg-accent/5 hover:bg-white hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-10 flex flex-col gap-6 items-center text-center lg:items-start lg:text-left">
                  <div className="p-5 bg-white rounded-3xl shadow-sm group-hover:scale-110 transition-transform duration-500">
                    {f.icon}
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Premium Menu Preview Section */}
        <section className="py-24 md:py-32 bg-accent/10">
          <div className="container px-6 md:px-12 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div className="flex flex-col gap-4 max-w-2xl">
                <Badge variant="outline" className="w-fit border-primary/20 bg-primary/5 text-primary font-bold">Menu Pilihan</Badge>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Menu Paling <span className="text-primary italic font-serif">Dicari</span></h2>
                <p className="text-muted-foreground text-lg">Pilihan favorit para barista dan pelanggan setia yang wajib Anda coba.</p>
              </div>
              <Link href="/menu">
                <Button variant="ghost" className="text-lg font-bold hover:bg-primary/5 transition-all gap-2 h-14 px-6 rounded-2xl group">
                  Lihat Semua Menu <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
                </Button>
              </Link>
            </div>
            
            <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[
                { name: "Kopi Gula Aren", price: "18.000", tag: "Signature", img: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=800&auto=format&fit=crop" },
                { name: "Nasi Goreng Nusantara", price: "35.000", tag: "Main Course", img: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=800&auto=format&fit=crop" },
                { name: "Sea Salt Latte", price: "25.000", tag: "Specialty", img: "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?q=80&w=800&auto=format&fit=crop" },
                { name: "Matcha Seremoni", price: "22.000", tag: "Tea Blend", img: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?q=80&w=800&auto=format&fit=crop" },
              ].map((m, i) => (
                <Card key={i} className="group border-none bg-background shadow-lg hover:shadow-2xl transition-all duration-500 rounded-[2rem] overflow-hidden">
                  <div className="relative aspect-[4/5] overflow-hidden">
                     <img src={m.img} alt={m.name} className="absolute inset-0 object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                     <div className="absolute top-4 right-4">
                        <Badge className="bg-white/90 text-primary border-none font-bold backdrop-blur-md shadow-lg">{m.tag}</Badge>
                     </div>
                     <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-1">
                        <h4 className="font-bold text-xl text-white tracking-tight">{m.name}</h4>
                        <p className="text-white/90 font-medium">Rp {m.price}</p>
                     </div>
                  </div>
                  <CardContent className="p-4 pt-0">
                    <Button variant="outline" className="w-full h-12 rounded-2xl border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all flex items-center gap-2 font-bold shadow-sm shadow-primary/5">
                      Tambah <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Dynamic CTA Section for iPad */}
        <section className="py-24 md:py-36 container px-6 md:px-12">
          <div className="relative overflow-hidden bg-primary rounded-[4rem] p-12 md:p-20 text-primary-foreground text-center flex flex-col items-center gap-10 shadow-3xl shadow-primary/40 group">
             {/* Decorative Circles */}
             <div className="absolute top-0 right-0 h-64 w-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-125 transition-transform duration-1000" />
             <div className="absolute bottom-0 left-0 h-64 w-64 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl group-hover:scale-125 transition-transform duration-1000" />

             <div className="flex flex-col gap-6 relative z-10">
                <Badge variant="secondary" className="w-fit mx-auto bg-white/20 text-white border-white/20 backdrop-blur-sm px-5 py-1 text-xs font-bold uppercase tracking-[0.2em]">Bergabunglah</Badge>
                <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold max-w-3xl leading-[1.1] tracking-tight">Kopi Favoritmu Menanti Percakapanmu</h2>
                <p className="text-primary-foreground/90 max-w-xl mx-auto text-lg md:text-xl font-medium">
                  Bergabunglah dengan ribuan penikmat kopi yang telah merasakan kecanggihan memesan lewat Barista AI.
                </p>
             </div>

             <div className="flex flex-col sm:flex-row gap-6 relative z-10 pt-4 w-full sm:w-auto">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto rounded-3xl px-12 h-18 text-xl font-black bg-white text-primary hover:bg-accent hover:text-primary-foreground transition-all shadow-xl">
                    Daftar Sekarang
                  </Button>
                </Link>
                <Link href="/order" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-3xl px-12 h-18 text-xl font-bold bg-white/10 text-white border-white/40 hover:bg-white hover:text-primary transition-all backdrop-blur-md">
                    Coba Chatbot
                  </Button>
                </Link>
             </div>

             <div className="flex items-center gap-2 relative z-10 opacity-70 mt-4 text-xs font-bold uppercase tracking-widest">
                <Heart className="h-4 w-4 fill-current" /> Dibuat oleh Kafe Nusantara
             </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t py-16 bg-background">
        <div className="container px-6 md:px-12 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-4 items-start">
             <div className="lg:col-span-2 flex flex-col gap-6">
                <Link href="/" className="flex items-center gap-3 font-black text-2xl tracking-tighter">
                  <Coffee className="h-8 w-8 text-primary" />
                  <span>AI CAFE ORDER</span>
                </Link>
                <p className="text-muted-foreground leading-relaxed max-w-sm">
                  Kami percaya bahwa teknologi seharusnya mempermudah kita kembali ke hal-hal esensial—seperti secangkir kopi hangat yang nikmat.
                </p>
             </div>
             
             <div className="flex flex-col gap-6">
                <h5 className="font-bold text-sm uppercase tracking-widest text-primary">Navigasi</h5>
                <nav className="flex flex-col gap-4 text-sm font-medium text-muted-foreground">
                   <Link href="/menu" className="hover:text-primary transition-colors">Daftar Menu</Link>
                   <Link href="/order" className="hover:text-primary transition-colors">Pesan Chatbot</Link>
                   <Link href="/history" className="hover:text-primary transition-colors">Riwayat Pesanan</Link>
                   <Link href="/track" className="hover:text-primary transition-colors">Lacak Pesanan</Link>
                </nav>
             </div>

             <div className="flex flex-col gap-6">
                <h5 className="font-bold text-sm uppercase tracking-widest text-primary">Bantuan</h5>
                <nav className="flex flex-col gap-4 text-sm font-medium text-muted-foreground">
                   <Link href="#" className="hover:text-primary transition-colors">Tentang Kami</Link>
                   <Link href="#" className="hover:text-primary transition-colors">Kebijakan Privasi</Link>
                   <Link href="#" className="hover:text-primary transition-colors">Kontak</Link>
                   <Link href="#" className="hover:text-primary transition-colors">Lokasi</Link>
                </nav>
             </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-primary/10 flex flex-col md:flex-row justify-between items-center gap-6">
             <p className="text-sm font-bold text-muted-foreground">© 2026 AI CAFE ORDER CHATBOT. Kafe Nusantara Group.</p>
             <div className="flex gap-6">
               <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer">
                  <span className="font-bold text-xs">FB</span>
               </div>
               <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer">
                  <span className="font-bold text-xs">IG</span>
               </div>
               <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer">
                  <span className="font-bold text-xs">TW</span>
               </div>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

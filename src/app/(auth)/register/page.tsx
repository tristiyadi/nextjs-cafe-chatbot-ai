"use client";

import { useState } from "react";
import Link from "next/link";
import { Coffee, ArrowRight, Loader2, Mail, Lock, User, Eye, EyeOff, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (error) {
        setError(error.message || "Gagal membuat akun. Silakan coba lagi.");
      } else {
        router.push("/order");
      }
    } catch {
      setError("Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-accent/20">
      {/* Left Design Section */}
      <div className="hidden lg:flex lg:flex-1 relative bg-primary items-center justify-center p-12 overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
             <defs>
               <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                 <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
               </pattern>
             </defs>
             <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="flex flex-col gap-8 max-w-lg relative z-10 text-primary-foreground">
          <Link href="/" className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <Coffee className="h-10 w-10" />
            <span>Kafe Nusantara</span>
          </Link>
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl lg:text-5xl font-bold font-serif italic italic leading-tight">Mulai Perjalanan Kopi Anda Bersama Kami.</h1>
            <p className="text-primary-foreground/80 leading-relaxed text-lg">
              Daftar sekarang untuk menikmati kemudahan memesan menu favorit Anda lewat AI Chatbot kami yang canggih.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 flex flex-col gap-2">
               <h4 className="font-bold text-lg">Gratis</h4>
               <p className="text-xs text-primary-foreground/70 leading-relaxed">Tanpa biaya pendaftaran, pesan kapan saja.</p>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 flex flex-col gap-2">
               <h4 className="font-bold text-lg">Personal</h4>
               <p className="text-xs text-primary-foreground/70 leading-relaxed">Dapatkan rekomendasi menu sesuai seleramu.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Register Form Section */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background overflow-y-auto relative">
        <Link 
          href="/" 
          className="absolute top-8 left-8 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Kembali ke Beranda
        </Link>
        
        <Card className="w-full max-w-md shadow-2xl border-primary/10 my-8">
          <CardHeader className="space-y-4">
            <div className="lg:hidden flex justify-center mb-4">
              <Link href="/" className="flex items-center gap-2 font-bold text-2xl">
                <Coffee className="h-8 w-8 text-primary" />
                <span>Kafe Nusantara</span>
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-3xl md:text-4xl font-black tracking-tight">Buat Akun <span className="text-primary italic font-serif">Baru</span></CardTitle>
              <CardDescription className="text-muted-foreground text-lg">
                Hanya butuh beberapa detik untuk mulai memesan kopi favorit Anda.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium leading-none">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Masukkan nama lengkap Anda"
                      className="pl-10 h-12 rounded-xl"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium leading-none">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="contoh@email.com"
                      className="pl-10 h-12 rounded-xl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium leading-none">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="pl-10 pr-10 h-12 rounded-xl"
                      value={password}
                      placeholder="**************************"
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium font-medium">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold gap-2 shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Sedang Mendaftar...
                  </>
                ) : (
                  <>
                    Daftar Sekarang <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-8">
            <div className="relative w-full my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Sudah punya akun?</span>
              </div>
            </div>
            
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full h-12 rounded-xl text-lg font-medium border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
                Masuk ke Akun Anda
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

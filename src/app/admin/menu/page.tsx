"use client";

import { useState, useEffect } from "react";
import { Coffee, Search, Plus, Trash2, Edit3, Save, X, Filter, LayoutGrid, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/layout/navbar";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  categoryId: string;
  isPopular: boolean;
  category: Category;
}

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("items");
  const [isAdding, setIsAdding] = useState(false);
  
  // New Item State
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    isPopular: false,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [menuRes, catRes] = await Promise.all([
        fetch("/api/menu"),
        fetch("/api/menu/categories")
      ]);
      const [menuData, catData] = await Promise.all([menuRes.json(), catRes.json()]);
      setItems(menuData.results || []);
      setCategories(catData.results || []);
    } catch (err) {
      console.error("Admin Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      if (res.ok) {
        setIsAdding(false);
        setNewItem({ name: "", description: "", price: "", categoryId: "", isPopular: false });
        fetchData();
      }
    } catch (err) {
      console.error("Add Item Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-accent/5">
      <Navbar />
      
      <main className="flex-1 container max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-16">
        <div className="flex flex-col gap-10 md:gap-16 transition-all duration-700">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex flex-col gap-4">
                 <Badge variant="outline" className="w-fit bg-primary/5 border-primary/20 text-primary self-center md:self-start mb-2 px-4 py-1 rounded-full uppercase tracking-widest text-[10px] font-bold">Admin Control</Badge>
                 <h1 className="text-4xl md:text-5xl lg:text-7xl font-black font-serif text-foreground leading-tight italic tracking-tighter">Manajemen <span className="text-primary italic">Menu</span></h1>
                 <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-xl">Tambahkan atau perbarui daftar menu Kafe Nusantara Anda secara efisien.</p>
              </div>
              <Button onClick={() => setIsAdding(!isAdding)} className="rounded-full px-8 h-14 text-lg font-bold gap-3 shadow-xl shadow-primary/30 animate-in slide-in-from-bottom-4">
                 {isAdding ? <><X className="h-5 w-5" /> Batal</> : <><Plus className="h-5 w-5" /> Tambah Menu</>}
              </Button>
           </div>

           {isAdding && (
             <Card className="rounded-[3rem] p-10 shadow-2xl border-primary/20 bg-background/50 backdrop-blur-xl animate-in zoom-in-95 fade-in duration-300">
                <form onSubmit={handleAddItem} className="grid md:grid-cols-2 gap-10">
                   <div className="flex flex-col gap-8">
                      <div className="flex flex-col gap-2">
                         <h3 className="text-2xl font-bold font-serif italic italic">Detail Menu Baru</h3>
                         <p className="text-sm text-muted-foreground">Deskripsi singkat akan membantu AI barista mempromosikan menu ini.</p>
                      </div>
                      <div className="flex flex-col gap-5">
                         <div className="space-y-2">
                           <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Nama Menu</label>
                           <Input 
                             placeholder="Misal: Es Kopi Susu Aren" 
                             className="h-14 rounded-2xl bg-accent/5 focus-visible:ring-primary/20 px-6"
                             value={newItem.name}
                             onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                             required
                           />
                         </div>
                         <div className="space-y-2">
                           <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Deskripsi</label>
                           <Input 
                             placeholder="Ceritakan rasa unik menu ini..." 
                             className="h-14 rounded-2xl bg-accent/5 focus-visible:ring-primary/20 px-6"
                             value={newItem.description}
                             onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                             required
                           />
                         </div>
                      </div>
                   </div>
                   <div className="flex flex-col gap-8">
                      <div className="flex flex-col gap-5 pt-10">
                         <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                               <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Harga (Rp)</label>
                               <Input 
                                 type="number"
                                 placeholder="25000" 
                                 className="h-14 rounded-2xl bg-accent/5 focus-visible:ring-primary/20 px-6"
                                 value={newItem.price}
                                 onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                                 required
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Kategori</label>
                               <select 
                                 className="h-14 w-full rounded-2xl bg-accent/5 focus-visible:ring-primary/20 px-6 outline-none border transition-all text-sm font-medium"
                                 value={newItem.categoryId}
                                 onChange={(e) => setNewItem({...newItem, categoryId: e.target.value})}
                                 required
                               >
                                  <option value="">Pilih...</option>
                                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                               </select>
                            </div>
                         </div>
                         <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-3xl border border-primary/10 mt-2">
                            <input 
                              type="checkbox" 
                              id="isPopular" 
                              className="h-6 w-6 accent-primary rounded-lg"
                              checked={newItem.isPopular}
                              onChange={(e) => setNewItem({...newItem, isPopular: e.target.checked})}
                            />
                            <label htmlFor="isPopular" className="text-sm font-bold flex items-center gap-2 cursor-pointer">
                               <Star className="h-4 w-4 fill-primary text-primary" /> Tandai sebagai Menu Populer
                            </label>
                         </div>
                         <Button type="submit" disabled={loading} className="w-full h-16 rounded-3xl text-xl font-bold mt-4 shadow-2xl shadow-primary/30 gap-3">
                            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <>Simpan Menu <Save className="h-6 w-6" /></>}
                         </Button>
                      </div>
                   </div>
                </form>
             </Card>
           )}

           <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-primary/10 pb-4">
                 <div className="flex gap-8">
                    <button 
                      onClick={() => setActiveTab("items")}
                      className={cn(
                        "text-lg font-bold pb-4 transition-all border-b-2 decoration-4 underline-offset-[16px]",
                        activeTab === "items" ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"
                      )}
                    >
                       Daftar Menu
                    </button>
                    <button 
                      onClick={() => setActiveTab("categories")}
                      className={cn(
                        "text-lg font-bold pb-4 transition-all border-b-2 decoration-4 underline-offset-[16px]",
                        activeTab === "categories" ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"
                      )}
                    >
                       Kategori
                    </button>
                 </div>
                 <div className="relative group hidden md:block">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input placeholder="Cari..." className="pl-10 h-10 w-64 rounded-xl bg-background/50" />
                 </div>
              </div>

              {activeTab === "items" && (
                <div className="grid gap-4">
                   {items.length === 0 ? (
                     <div className="text-center py-20 opacity-30 select-none">
                        <LayoutGrid className="h-20 w-20 mx-auto opacity-20" />
                        <p className="text-xl font-bold mt-4">Belum ada menu</p>
                     </div>
                   ) : (
                     items.map(item => (
                       <Card key={item.id} className="group rounded-[2rem] border-primary/5 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all p-4 bg-background/50 overflow-hidden">
                          <CardContent className="p-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
                             <div className="flex items-center gap-6">
                                <div className="h-20 w-20 bg-muted rounded-[1.5rem] flex items-center justify-center border border-primary/5 flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                                   <Coffee className="h-8 w-8 text-primary/30" />
                                </div>
                                <div className="flex flex-col gap-1">
                                   <div className="flex items-center gap-2">
                                      <h4 className="text-xl font-bold tracking-tight">{item.name}</h4>
                                      {item.isPopular && <Badge className="bg-amber-500 border-none h-5 px-1.5"><Star className="h-3 w-3 fill-current" /></Badge>}
                                   </div>
                                   <p className="text-sm text-muted-foreground line-clamp-1 max-w-md italic font-serif italic">{item.description}</p>
                                   <Badge variant="secondary" className="w-fit text-[10px] font-bold tracking-[0.1em] px-3 border-primary/5">{item.category?.name || "Uncategorized"}</Badge>
                                </div>
                             </div>
                             
                             <div className="flex items-center justify-between md:justify-end gap-10 border-t md:border-t-0 pt-4 md:pt-0">
                                <div className="flex flex-col items-end">
                                   <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Harga Resmi</span>
                                   <span className="text-2xl font-black text-primary tracking-tighter">Rp {parseFloat(item.price).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex gap-2">
                                   <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-primary/10 hover:bg-primary/5 hover:text-primary transition-all">
                                      <Edit3 className="h-5 w-5" />
                                   </Button>
                                   <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-destructive hover:bg-red-50 transition-all">
                                      <Trash2 className="h-5 w-5" />
                                   </Button>
                                </div>
                             </div>
                          </CardContent>
                       </Card>
                     ))
                   )}
                </div>
              )}

              {activeTab === "categories" && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                   {categories.map(cat => (
                     <Card key={cat.id} className="rounded-3xl border-primary/5 shadow-md p-8 bg-background group hover:bg-primary/5 transition-all text-center">
                        <div className="flex flex-col items-center gap-4">
                           <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-lg shadow-primary/10">
                              {cat.name.charAt(0)}
                           </div>
                           <div>
                              <h4 className="text-2xl font-bold font-serif italic italic">{cat.name}</h4>
                              <p className="text-xs text-muted-foreground font-mono mt-1 opacity-60">slug: {cat.slug}</p>
                           </div>
                           <Separator className="bg-primary/5" />
                           <div className="flex gap-2 pt-2">
                              <Button variant="outline" size="sm" className="rounded-xl px-4 font-bold border-primary/10">Edit</Button>
                              <Button variant="ghost" size="sm" className="rounded-xl px-4 text-destructive font-bold hover:bg-red-50">Hapus</Button>
                           </div>
                        </div>
                     </Card>
                   ))}
                   <Card className="rounded-3xl border-dashed border-2 flex flex-col items-center justify-center p-8 gap-4 opacity-50 hover:opacity-100 transition-opacity cursor-pointer min-h-[250px] border-primary/20">
                      <div className="h-12 w-12 rounded-full border-2 border-primary flex items-center justify-center text-primary">
                         <Plus className="h-6 w-6" />
                      </div>
                      <span className="font-bold text-lg">Tambah Kategori Baru</span>
                   </Card>
                </div>
              )}
           </div>
        </div>
      </main>
    </div>
  );
}

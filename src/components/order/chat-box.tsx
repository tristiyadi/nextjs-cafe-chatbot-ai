/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, Maximize2, Minimize2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatBoxProps {
  isFullSize?: boolean;
  onToggleSize?: () => void;
}

function TypewriterText({ text, onRender }: { text: string; onRender: (t: string) => any }) {
  const [displayText, setDisplayText] = useState("");
  
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayText(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(timer);
    }, 15);
    return () => clearInterval(timer);
  }, [text]);

  return <>{onRender(displayText)}</>;
}

export function ChatBox({ isFullSize, onToggleSize }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Halo! Saya barista AI Kafe Nusantara. Ada yang bisa saya bantu? Kamu bisa tanya rekomendasi menu atau langsung pesan di sini." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const addItem = useCart((state) => state.addItem);
  const [allMenuItems, setAllMenuItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch("/api/menu");
        const data = await res.json();
        if (data.results) setAllMenuItems(data.results);
      } catch (err) {
        console.error("Failed to fetch menu list for ordering:", err);
      }
    };
    fetchMenu();
  }, []);

  // Parsing message for [ORDER:name 1,nama 2,...]
  const renderMessageContent = (content: string) => {
    const orderRegex = /\[ORDER:(.*?)\]/g;
    const parts = content.split(orderRegex);
    
    if (parts.length === 1) return content;

    const elements = [];
    for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
            // Text part
            if (parts[i]) elements.push(<span key={`text-${i}`}>{parts[i]}</span>);
        } else {
            // Order part (comma separated names)
            const itemNames = parts[i].split(",").map((n) => n.trim().toLowerCase());
            
            // Find items that match the names in our fetched menu
            const matchedItems = allMenuItems.filter(item => 
              itemNames.includes(item.name.toLowerCase())
            );

            if (matchedItems.length > 0) {
              elements.push(
                <div key={`order-group-${i}`} className="flex flex-col gap-3 mt-3 mb-1">
                  {matchedItems.map((item, idx) => (
                    <div key={`order-item-${item.id}-${idx}`} className="p-3 bg-primary/10 rounded-xl border border-primary/20 flex flex-col gap-2 animate-in fade-in zoom-in duration-300">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs">{item.name}</span>
                        <span className="text-primary font-black text-xs">
                          Rp {parseFloat(item.price).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full h-8 rounded-lg text-[10px] font-bold gap-2"
                        onClick={() => {
                          addItem({
                            menuItemId: item.id,
                            name: item.name,
                            price: parseFloat(item.price),
                            quantity: 1
                          });
                        }}
                      >
                        <PlusCircle className="h-3 w-3" /> Tambah Pesanan
                      </Button>
                    </div>
                  ))}
                </div>
              );
            }
        }
    }
    return elements;
  };

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth"
        });
      }
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, sessionId }),
      });

      const data = await res.json();
      if (data.text) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
        if (data.sessionId) setSessionId(data.sessionId);
      }
    } catch (err) {
      console.error("Chat Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={cn(
      "flex flex-col border-primary/10 overflow-hidden shadow-xl bg-background/50 backdrop-blur transition-all",
      isFullSize ? "h-[800px] md:h-[600px]" : "h-[600px] md:h-[65vh] lg:h-[75vh]"
    )}>
      <div className="p-4 border-b bg-primary text-primary-foreground flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <div>
             <h3 className="font-bold text-sm">Barista AI</h3>
             <p className="text-[10px] opacity-80 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /> Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onToggleSize && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onToggleSize}
              className="h-8 w-8 hover:bg-white/10 text-white/70 hover:text-white"
            >
              {isFullSize ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          )}
          <Sparkles className="h-4 w-4 opacity-50" />
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-6">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div
                className={cn(
                  "rounded-2xl p-3 text-sm shadow-sm leading-relaxed whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted/80 backdrop-blur-sm border rounded-tl-none text-foreground"
                )}
              >
                {m.role === "assistant" ? (
                  i === messages.length - 1 ? (
                    <TypewriterText 
                      text={m.content} 
                      onRender={(t) => renderMessageContent(t)} 
                    />
                  ) : (
                    renderMessageContent(m.content)
                  )
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 mr-auto items-center text-muted-foreground animate-pulse">
               <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                 <Bot className="h-4 w-4" />
               </div>
               <div className="flex gap-1">
                 <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 animate-bounce" />
                 <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 animate-bounce [animation-delay:0.2s]" />
                 <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 animate-bounce [animation-delay:0.4s]" />
               </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 relative"
        >
          <Input
            placeholder="Tanyakan sesuatu..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="pr-12 rounded-full h-12 border-primary/10 shadow-inner"
          />
          <Button
            type="submit"
            size="icon"
            disabled={loading}
            className="absolute right-1 top-1 h-10 w-10 rounded-full"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        <p className="text-[10px] text-center text-muted-foreground mt-2 italic">
          AI Barista bisa membuat kesalahan. Pastikan pesanan Anda di Menu.
        </p>
      </div>
    </Card>
  );
}

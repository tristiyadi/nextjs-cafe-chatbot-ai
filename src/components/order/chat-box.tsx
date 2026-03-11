"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Halo! Saya barista AI Kafe Nusantara. Ada yang bisa saya bantu? Kamu bisa tanya rekomendasi menu atau langsung pesan di sini." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
    <Card className="flex flex-col h-[600px] md:h-[65vh] lg:h-[75vh] border-primary/10 overflow-hidden shadow-xl bg-background/50 backdrop-blur">
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
        <Sparkles className="h-4 w-4 opacity-50" />
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-6">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3 max-w-[85%]",
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
                  "rounded-2xl p-3 text-sm shadow-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted/80 backdrop-blur-sm border rounded-tl-none text-foreground"
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 mr-auto items-center text-muted-foreground">
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
